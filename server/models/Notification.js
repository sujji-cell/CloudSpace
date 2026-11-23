import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(

    {
        // User who receives the notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // User who triggered the notification
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // Notification type
        type: {
            type: String,
            enum: [
                "file_shared",
                "file_updated",
                "file_uploaded",
                "storage_alert",
                "security_alert",
                "account_activity"
            ],
            required: true
        },

        // Notification title
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120
        },

        // Notification description
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        // Related file (if applicable)
        relatedFile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            default: null
        },

        // Related folder (if applicable)
        relatedFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            default: null
        },

        // Navigation destination
        link: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        // Read status
        isRead: {
            type: Boolean,
            default: false
        },

        // When notification was read
        readAt: {
            type: Date,
            default: null
        }

    },

    {
        timestamps: true
    }

);


// ============================================
// AUTOMATIC READ STATUS MANAGEMENT
// ============================================

notificationSchema.pre("validate", function () {

    if (!this.isRead) {

        this.readAt = null;

    } else if (!this.readAt) {

        this.readAt = new Date();

    }

});


// ============================================
// DATABASE INDEXES
// ============================================

// Efficiently retrieve a user's latest notifications
notificationSchema.index({
    recipient: 1,
    createdAt: -1
});

// Efficiently count unread notifications for a user
notificationSchema.index({
    recipient: 1,
    isRead: 1
});


const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;