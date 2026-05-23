import { asyncHandler } from "../utils/asyncHandler.js";
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import ApiError from "../utils/ApiError.js";
import { createNotification } from "../services/notification.service.js";

const STATUS_LABELS = {
  new: "New",
  in_review: "In Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

const statusLabel = (status) => STATUS_LABELS[status] || status?.replace(/_/g, " ") || "updated";

function statusNotificationPayload(issue, status, actor, rejectionReason = "") {
  const cleanReason = status === "rejected" ? rejectionReason : "";
  const reason = cleanReason ? ` Reason: ${cleanReason}` : "";
  return {
    issueId: issue._id,
    title: issue.title,
    category: issue.category,
    location: issue.location,
    status,
    statusLabel: statusLabel(status),
    rejectionReason: cleanReason,
    actorUserId: actor._id,
    actorName: actor.fullName,
    message: `Your issue "${issue.title}" was marked ${statusLabel(status)}.${reason}`,
  };
}

export const getAdminStats = asyncHandler(async (_req, res) => {
  const [totalIssues, pendingReview, resolvedToday, activeUsers] = await Promise.all([
    Issue.countDocuments(),
    Issue.countDocuments({ status: "in_review" }),
    Issue.countDocuments({
      status: "resolved",
      resolvedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
    User.countDocuments({ suspended: false }),
  ]);

  return res.json({
    success: true,
    data: { totalIssues, pendingReview, resolvedToday, activeUsers },
  });
});

export const listAdminIssues = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const issues = await Issue.find(filter).sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, data: issues });
});

export const moderateIssue = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");

  const { status, rejectionReason = "" } = req.body;
  const previousStatus = issue.status;
  issue.status = status || issue.status;
  issue.reviewedBy = req.user._id;
  issue.reviewedAt = new Date();
  if (status === "rejected") issue.rejectionReason = rejectionReason;
  if (status === "resolved") issue.resolvedAt = new Date();
  await issue.save();

  if (status && status !== previousStatus && issue.reportedBy.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: issue.reportedBy,
      type: "issue_status_changed",
      payload: statusNotificationPayload(issue, status, req.user, issue.rejectionReason),
      io,
    });
  }

  if (io) io.to(`issue:${issue._id.toString()}`).emit("issue:updated", { issueId: issue._id, issue });

  return res.json({ success: true, data: issue });
});

export const bulkModerateIssues = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const { issueIds = [], status, rejectionReason = "" } = req.body;
  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "issueIds array is required");
  }
  if (!status) throw new ApiError(StatusCodes.BAD_REQUEST, "status is required");

  const beforeIssues = await Issue.find({ _id: { $in: issueIds } });
  const previousStatusById = new Map(beforeIssues.map((issue) => [issue._id.toString(), issue.status]));

  const updates = {
    status,
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };
  if (status === "rejected") updates.rejectionReason = rejectionReason;
  if (status === "resolved") updates.resolvedAt = new Date();

  await Issue.updateMany({ _id: { $in: issueIds } }, updates);

  const updatedIssues = await Issue.find({ _id: { $in: issueIds } });
  await Promise.all(updatedIssues.map(async (issue) => {
    const changed = previousStatusById.get(issue._id.toString()) !== status;
    if (changed && issue.reportedBy.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: issue.reportedBy,
        type: "issue_status_changed",
        payload: statusNotificationPayload(issue, status, req.user, issue.rejectionReason),
        io,
      });
    }
    if (io) io.to(`issue:${issue._id.toString()}`).emit("issue:updated", { issueId: issue._id, issue });
  }));

  return res.json({ success: true, message: "Bulk moderation applied", data: { count: issueIds.length } });
});

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-passwordHash").sort({ createdAt: -1 }).limit(200);
  return res.json({ success: true, data: users });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const { role } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-passwordHash");
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  if (user._id.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: user._id,
      type: "account_role_changed",
      payload: {
        role: user.role,
        actorUserId: req.user._id,
        actorName: req.user.fullName,
        message: `Your account role was changed to ${user.role}.`,
      },
      io,
    });
  }

  return res.json({ success: true, data: user });
});

export const setUserSuspended = asyncHandler(async (req, res) => {
  const { suspended } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { suspended: Boolean(suspended) },
    { new: true }
  ).select("-passwordHash");
  if (!user) throw new ApiError(StatusCodes.NOT_FOUND, "User not found");

  return res.json({ success: true, data: user });
});
