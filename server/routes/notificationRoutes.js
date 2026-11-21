import express from "express";

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
} from "../controllers/notificationController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all notifications
router.get("/", getNotifications);

// Mark all notifications as read
router.put("/read-all", markAllNotificationsAsRead);

// Mark one notification as read
router.put("/:id/read", markNotificationAsRead);

// Delete one notification
router.delete("/:id", deleteNotification);

export default router;