import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(

    {
        // User who receives the notification
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
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
            trim: true
        },

        // Notification description
        message: {
            type: String,
            required: true,
            trim: true
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
            default: ""
        },

        // Read status
        isRead: {
            type: Boolean,
            default: false,
            index: true
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


// Index for retrieving a user's latest notifications
notificationSchema.index({
    recipient: 1,
    createdAt: -1
});


const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;