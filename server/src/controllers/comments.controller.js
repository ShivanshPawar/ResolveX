import { StatusCodes } from "http-status-codes";
import Comment from "../models/Comment.js";
import Issue from "../models/Issue.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "../services/notification.service.js";

const USER_SELECT = "fullName avatarUrl";

async function getDepth(parentId) {
  let depth = 1, current = parentId;
  while (current) {
    const parent = await Comment.findById(current).select("parentId");
    if (!parent) break;
    depth++; current = parent.parentId;
    if (depth > 3) break;
  }
  return depth;
}

export const getCommentsByIssue = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ issueId: req.params.issueId })
    .populate("userId", USER_SELECT)
    .sort({ createdAt: 1 })
    .lean();
  return res.json({ success: true, data: comments });
});

export const createComment = asyncHandler(async (req, res) => {
  const io    = req.app.get("io");
  const issue = await Issue.findById(req.params.issueId);
  if (!issue) throw new ApiError(StatusCodes.NOT_FOUND, "Issue not found");

  const { text, parentId = null } = req.body;
  if (parentId) {
    const depth = await getDepth(parentId);
    if (depth > 3) throw new ApiError(StatusCodes.BAD_REQUEST, "Max nesting depth is 3");
  }

  const comment = await Comment.create({ issueId: issue._id, userId: req.user._id, text, parentId });
  await comment.populate("userId", USER_SELECT);
  await Issue.findByIdAndUpdate(issue._id, { $inc: { commentsCount: 1 } });

  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: issue.reportedBy,
      type: "issue_comment",
      payload: {
        issueId: issue._id,
        commentId: comment._id,
        actorUserId: req.user._id,
        actorName: req.user.fullName,
        message: `${req.user.fullName} commented on your issue "${issue.title}"`,
      },
      io,
    });
  }

  if (io) io.to(`issue:${issue._id}`).emit("comment:created", { issueId: issue._id, comment });
  return res.status(StatusCodes.CREATED).json({ success: true, data: comment });
});

export const updateComment = asyncHandler(async (req, res) => {
  const io      = req.app.get("io");
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  if (comment.userId.toString() !== req.user._id.toString())
    throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");
  comment.text = req.body.text;
  comment.isEdited = true;
  await comment.save();
  await comment.populate("userId", USER_SELECT);
  if (io) io.to(`issue:${comment.issueId}`).emit("comment:updated", { issueId: comment.issueId, comment });
  return res.json({ success: true, data: comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const io      = req.app.get("io");
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(StatusCodes.NOT_FOUND, "Comment not found");
  const isOwner = comment.userId.toString() === req.user._id.toString();
  if (!isOwner && !["admin","moderator"].includes(req.user.role))
    throw new ApiError(StatusCodes.FORBIDDEN, "Not allowed");
  comment.text = "[deleted]";
  comment.isDeleted = true;
  await comment.save();
  if (io) io.to(`issue:${comment.issueId}`).emit("comment:deleted", { issueId: comment.issueId, commentId: comment._id });
  return res.json({ success: true, message: "Comment deleted" });
});
