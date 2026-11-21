import Notification from "../models/Notification.js";

// Get all notifications for the logged-in user
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.userId
        })
            .populate("sender", "fullName email")
            .populate("relatedFile", "originalName")
            .sort({ createdAt: -1 });

        const unreadCount = await Notification.countDocuments({
            recipient: req.userId,
            isRead: false
        });

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


// Mark one notification as read
export const markNotificationAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            recipient: req.userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found."
            });
        }

        notification.isRead = true;
        notification.readAt = new Date();

        await notification.save();

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


// Mark all notifications as read
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


// Delete one notification
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
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