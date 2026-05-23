import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import Issue from "../models/Issue.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadIssueImage, deleteImageByFileId } from "../services/imagekit.service.js";

export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash");
  return res.json({ success: true, data: user });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ["fullName", "phone", "address", "bio"];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select("-passwordHash");

  return res.json({ success: true, data: user });
});

export const changeMyPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "currentPassword and newPassword are required");
  }

  const user = await User.findById(req.user._id);
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new ApiError(StatusCodes.BAD_REQUEST, "Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  return res.json({ success: true, message: "Password updated successfully" });
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  const file = req.file;
  if (!file) throw new ApiError(StatusCodes.BAD_REQUEST, "Avatar file is required");

  const user = await User.findById(req.user._id);
  if (user.avatarFileId) {
    await deleteImageByFileId(user.avatarFileId).catch(() => null);
  }

  const uploaded = await uploadIssueImage({
    file,
    issueId: "avatars",
    userId: req.user._id.toString(),
  });

  user.avatarUrl = uploaded.url;
  user.avatarFileId = uploaded.fileId;
  await user.save();

  return res.json({ success: true, data: { avatarUrl: uploaded.url } });
});

export const getMyDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const [totalIssues, resolvedIssues, inProgressIssues, recentIssues] = await Promise.all([
    Issue.countDocuments({ reportedBy: userId }),
    Issue.countDocuments({ reportedBy: userId, status: "resolved" }),
    Issue.countDocuments({ reportedBy: userId, status: "in_progress" }),
    Issue.find({ reportedBy: userId }).sort({ createdAt: -1 }).limit(5),
  ]);

  return res.json({
    success: true,
    data: {
      totalIssues,
      resolvedIssues,
      inProgressIssues,
      recentIssues,
    },
  });
});
