import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import Issue from "../models/Issue.js";
import Upvote from "../models/Upvote.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadIssueImage, deleteImageByFileId } from "../services/imagekit.service.js";
import { createNotification, createRoleNotifications } from "../services/notification.service.js";

const STATUS_LABELS = {
  new: "New",
  in_review: "In Review",
  in_progress: "In Progress",
  resolved: "Resolved",
  rejected: "Rejected",
};

const statusLabel = (status) => STATUS_LABELS[status] || status?.replace(/_/g, " ") || "updated";

const issuePayload = (issue) => ({
  issueId: issue._id,
  title: issue.title,
  category: issue.category,
  location: issue.location,
});

function buildQuery(q) {
  const filter = {};
  if (q.category) filter.category = q.category;
  if (q.status)   filter.status   = q.status;
  if (q.userId && mongoose.isValidObjectId(q.userId)) filter.reportedBy = q.userId;
  if (q.search)   filter.$text    = { $search: q.search };
  return filter;
}

export const listIssues = asyncHandler(async (req, res) => {
  const { page = "1", limit = "20", sort = "newest" } = req.query;
  const safePage  = Math.max(1, Number(page));
  const safeLimit = Math.min(100, Math.max(1, Number(limit)));
  const filter    = buildQuery(req.query);

  const sortMap = {
    newest:       { createdAt: -1 },
    oldest:       { createdAt:  1 },
    most_upvoted: { upvotes: -1, createdAt: -1 },
  };

  const [issues, total] = await Promise.all([
    Issue.find(filter)
      .populate("reportedBy", "fullName email avatarUrl")
      .sort(sortMap[sort] || sortMap.newest)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    Issue.countDocuments(filter),
  ]);

  // Attach hasUpvoted per issue for authenticated users
  let upvotedIds = new Set();
  if (req.user && issues.length) {
    const issueIds = issues.map(i => i._id);
    const upvotes  = await Upvote.find({
      issueId: { $in: issueIds },
      userId:  req.user._id,
    }).select("issueId").lean();
    upvotedIds = new Set(upvotes.map(u => u.issueId.toString()));
  }

  const enriched = issues.map(i => ({
    ...i,
    hasUpvoted: upvotedIds.has(i._id.toString()),
  }));

  return res.json({
    success: true,
    data: enriched,
    meta: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) },
  });
});

export const getIssueById = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate("reportedBy", "fullName email avatarUrl")
    .lean();
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");

  let hasUpvoted = false;
  if (req.user) {
    const upvote = await Upvote.findOne({ issueId: issue._id, userId: req.user._id });
    hasUpvoted = !!upvote;
  }

  return res.json({ success: true, data: { ...issue, hasUpvoted } });
});

export const createIssue = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const { latitude = null, longitude = null, ...rest } = req.body;

  const issue = await Issue.create({
    ...rest,
    latitude,
    longitude,
    reportedBy: req.user._id,
    locationGeo: latitude != null && longitude != null
      ? { type: "Point", coordinates: [longitude, latitude] }
      : undefined,
  });

  if (io) io.emit("issue:created", { issueId: issue._id, issue });

  await createRoleNotifications({
    roles: ["admin", "moderator"],
    excludeUserIds: [req.user._id],
    type: "issue_created",
    payload: {
      ...issuePayload(issue),
      actorUserId: req.user._id,
      actorName: req.user.fullName,
      message: `New ${issue.category} issue reported by ${req.user.fullName}: "${issue.title}"`,
    },
    io,
  });

  return res.status(StatusCodes.CREATED).json({ success: true, data: issue });
});

export const updateIssue = asyncHandler(async (req, res) => {
  const io    = req.app.get("io");
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");

  const isOwner     = issue.reportedBy.toString() === req.user._id.toString();
  const isPrivileged = ["admin", "moderator"].includes(req.user.role);
  if (!isOwner && !isPrivileged) throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");

  const previousStatus = issue.status;
  const updates = { ...req.body };
  if (updates.latitude != null && updates.longitude != null) {
    updates.locationGeo = { type: "Point", coordinates: [updates.longitude, updates.latitude] };
  }
  if (updates.status === "resolved" && !issue.resolvedAt) updates.resolvedAt = new Date();
  if (updates.status === "rejected") { updates.reviewedAt = new Date(); updates.reviewedBy = req.user._id; }

  Object.assign(issue, updates);
  await issue.save();

  // Notify reporter when status changes
  const statusChanged = updates.status && updates.status !== previousStatus;
  if (statusChanged && issue.reportedBy.toString() !== req.user._id.toString()) {
    const rejectionReason = updates.status === "rejected" ? issue.rejectionReason : "";
    const rejectedReason = rejectionReason
      ? ` Reason: ${rejectionReason}`
      : "";
    await createNotification({
      userId: issue.reportedBy,
      type: "issue_status_changed",
      payload: {
        ...issuePayload(issue),
        status: updates.status,
        statusLabel: statusLabel(updates.status),
        rejectionReason,
        actorUserId: req.user._id,
        actorName: req.user.fullName,
        message: `Your issue "${issue.title}" was marked ${statusLabel(updates.status)}.${rejectedReason}`,
      },
      io,
    });
  }

  const reporterEdited = isOwner && !statusChanged && ["title", "description", "category", "location", "latitude", "longitude"]
    .some((field) => Object.prototype.hasOwnProperty.call(updates, field));
  if (reporterEdited) {
    await createRoleNotifications({
      roles: ["admin", "moderator"],
      excludeUserIds: [req.user._id],
      type: "issue_updated",
      payload: {
        ...issuePayload(issue),
        actorUserId: req.user._id,
        actorName: req.user.fullName,
        message: `${req.user.fullName} updated an issue: "${issue.title}"`,
      },
      io,
    });
  }

  if (io) io.to(`issue:${issue._id.toString()}`).emit("issue:updated", { issueId: issue._id, issue });
  return res.json({ success: true, data: issue });
});

export const deleteIssue = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");
  const isOwner = issue.reportedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");

  if (!isOwner) {
    await createNotification({
      userId: issue.reportedBy,
      type: "issue_deleted",
      payload: {
        deletedIssueId: issue._id,
        title: issue.title,
        actorUserId: req.user._id,
        actorName: req.user.fullName,
        message: `Your issue "${issue.title}" was deleted by ${req.user.fullName}.`,
      },
      io,
    });
  }

  await issue.deleteOne();
  return res.json({ success: true, message: "Issue deleted" });
});

export const uploadIssueImages = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");
  const isOwner = issue.reportedBy.toString() === req.user._id.toString();
  if (!isOwner && !["admin","moderator"].includes(req.user.role))
    throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");
  const files = req.files || [];
  if (!files.length) throw new ApiError(StatusCodes.BAD_REQUEST, "No files provided");
  const uploaded = await Promise.all(
    files.map(f => uploadIssueImage({ file: f, issueId: issue._id.toString(), userId: req.user._id.toString() }))
  );
  issue.images.push(...uploaded);
  await issue.save();
  return res.status(StatusCodes.CREATED).json({ success: true, data: uploaded });
});

export const deleteIssueImage = asyncHandler(async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");
  const isOwner = issue.reportedBy.toString() === req.user._id.toString();
  if (!isOwner && !["admin","moderator"].includes(req.user.role))
    throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");
  const img = issue.images.find(i => i.fileId === req.params.fileId);
  if (!img) throw new ApiError(StatusCodes.NOT_FOUND, "Image not found");
  await deleteImageByFileId(req.params.fileId);
  issue.images = issue.images.filter(i => i.fileId !== req.params.fileId);
  await issue.save();
  return res.json({ success: true, message: "Image deleted" });
});

export const getNearbyIssues = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng), km = Number(req.query.radiusKm || 5);
  if (isNaN(lat) || isNaN(lng)) throw new ApiError(StatusCodes.BAD_REQUEST, "lat and lng required");
  const issues = await Issue.find({
    locationGeo: { $near: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: km * 1000 } },
  }).populate("reportedBy", "fullName").sort({ createdAt: -1 }).limit(100).lean();
  return res.json({ success: true, data: issues });
});
