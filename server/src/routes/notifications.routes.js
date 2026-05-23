import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notifications.controller.js";

const router = Router();

router.use(requireAuth);
router.get("/", listMyNotifications);
router.patch("/:id/read", markNotificationRead);
router.post("/read-all", markAllNotificationsRead);

export default router;
