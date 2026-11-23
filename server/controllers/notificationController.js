
import Notification from "../models/Notification.js";
import mongoose from "mongoose";


// ============================================
// 1. GET ALL NOTIFICATIONS
// ============================================

export const getNotifications = async (req, res) => {

    try {

        const userId = req.userId;

        // Fetch notifications and unread count concurrently
        const [notifications, unreadCount] = await Promise.all([

            Notification.find({
                recipient: userId
            })
                .populate("sender", "fullName email")
                .populate("relatedFile", "originalName")
                .sort({
                    createdAt: -1,
                    _id: -1
                })
                .lean(),

            Notification.countDocuments({
                recipient: userId,
                isRead: false
            })

        ]);

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });

    } catch (error) {

        console.error("Get notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch notifications."
        });

    }
};


// ============================================
// 2. MARK ONE NOTIFICATION AS READ
// ============================================

export const markNotificationAsRead = async (req, res) => {

    try {

        const { id } = req.params;

        // Validate notification ID
        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });

        }

        // Update only unread notifications belonging to this user
        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                recipient: req.userId,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            },
            {
                new: true
            }
        );

        if (!notification) {

            // Check whether it already exists and belongs to this user
            const existingNotification = await Notification.exists({
                _id: id,
                recipient: req.userId
            });

            if (!existingNotification) {

                return res.status(404).json({
                    success: false,
                    message: "Notification not found."
                });

            }

            return res.status(200).json({
                success: true,
                message: "Notification is already marked as read."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read."
        });

    } catch (error) {

        console.error("Mark notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notification."
        });

    }
};


// ============================================
// 3. MARK ALL NOTIFICATIONS AS READ
// ============================================

export const markAllNotificationsAsRead = async (req, res) => {

    try {

        await Notification.updateMany(
            {
                recipient: req.userId,
                isRead: false
            },
            {
                $set: {
                    isRead: true,
                    readAt: new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read."
        });

    } catch (error) {

        console.error("Mark all notifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update notifications."
        });

    }
};


// ============================================
// 4. DELETE ONE NOTIFICATION
// ============================================

export const deleteNotification = async (req, res) => {

    try {

        const { id } = req.params;

        // Validate notification ID
        if (!mongoose.Types.ObjectId.isValid(id)) {

            return res.status(400).json({
                success: false,
                message: "Invalid notification ID."
            });

        }

        // Delete only notifications belonging to this user
        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: req.userId
        });

        if (!notification) {

            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully."
        });

    } catch (error) {

        console.error("Delete notification error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete notification."
        });

    }
};
