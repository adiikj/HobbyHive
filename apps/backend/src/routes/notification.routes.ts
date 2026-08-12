import { Router } from "express";
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", verifyJWT, listNotifications);
router.get("/unread-count", verifyJWT, getUnreadCount);
router.post("/read-all", verifyJWT, markAllNotificationsRead);
router.patch("/:id/read", verifyJWT, markNotificationRead);

export default router;
