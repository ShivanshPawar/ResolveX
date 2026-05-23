import { asyncHandler } from "../utils/asyncHandler.js";
import Notification from "../models/Notification.js";

export const listMyNotifications = asyncHandler(async (req, res) => {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    Notification.countDocuments({ userId: req.user._id, read: false }),
  ]);
  return res.json({ success: true, data: notifications, meta: { unreadCount } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { read: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
    { new: true }
  );
  return res.json({ success: true, data: notif });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, read: false },
    { read: true, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
  );
  return res.json({ success: true, message: "All marked as read" });
});
