import mongoose from "mongoose";

import Share from "../models/Share.js";
import File from "../models/File.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";


// 1. Share a file with another user
export const shareFile = async (req, res) => {
    try {
        const { fileId, email } = req.body;
        const ownerId = req.userId;

        if (!fileId || !email) {
            return res.status(400).json({
                message: "File ID and recipient email are required."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                message: "Invalid file ID."
            });
        }

        // Find file belonging to the logged-in user
        const file = await File.findOne({
            _id: fileId,
            owner: ownerId
        });

        if (!file) {
            return res.status(404).json({
                message: "File not found or you do not own this file."
            });
        }

        // Find recipient
        const recipient = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!recipient) {
            return res.status(404).json({
                message: "No CloudSpace account found with this email."
            });
        }

        if (!recipient.isVerified) {
            return res.status(403).json({
                message: "Recipient must verify their email first."
            });
        }

        if (recipient._id.toString() === ownerId.toString()) {
            return res.status(400).json({
                message: "You cannot share a file with yourself."
            });
        }

        // Check existing sharing record
        const existingShare = await Share.findOne({
            file: fileId,
            recipient: recipient._id
        });

        // Prevent duplicate active sharing
        if (existingShare?.isActive) {
            return res.status(409).json({
                message: "This file is already shared with this user."
            });
        }

        // Restore access if previously revoked
        if (existingShare) {

            existingShare.owner = ownerId;
            existingShare.isActive = true;

            await existingShare.save();

        } else {

            // Create a new sharing record
            await Share.create({
                file: fileId,
                owner: ownerId,
                recipient: recipient._id
            });
        }


        // Create ONE in-app notification for the recipient
        try {

            const notificationsEnabled =
                recipient.notificationPreferences?.inApp?.sharedFileUpdates !== false;

            if (notificationsEnabled) {

                // Get file owner's name
                const owner = await User.findById(ownerId)
                    .select("firstName middleName lastName email");

                const ownerName = owner
                    ? [
                        owner.firstName,
                        owner.middleName,
                        owner.lastName
                    ]
                        .filter(Boolean)
                        .join(" ") || owner.email
                    : "Someone";

                // Create notification
                await Notification.create({
                    recipient: recipient._id,
                    sender: ownerId,
                    type: "file_shared",
                    title: "New File Shared",
                    message: `${ownerName} shared "${file.originalName}" with you.`,
                    relatedFile: file._id,
                    link: "/shared"
                });
            }

        } catch (notificationError) {

            // Notification failure should not affect file sharing
            console.error(
                "Notification creation failed:",
                notificationError.message
            );
        }


        return res.status(200).json({
            message: `File shared successfully with ${recipient.email}.`
        });

    } catch (error) {

        console.error("Share File Error:", error);

        return res.status(500).json({
            message: "Unable to share file."
        });
    }
};


// 2. Get files shared WITH the logged-in user
export const getSharedWithMe = async (req, res) => {
    try {

        const shares = await Share.find({
            recipient: req.userId,
            isActive: true
        })
            .populate("file")
            .populate(
                "owner",
                "firstName middleName lastName email"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            shares
        });

    } catch (error) {

        console.error("Get Shared Files Error:", error);

        return res.status(500).json({
            message: "Unable to fetch shared files."
        });
    }
};


// 3. Get files shared BY the logged-in user
export const getSharedByMe = async (req, res) => {
    try {

        const shares = await Share.find({
            owner: req.userId,
            isActive: true
        })
            .populate("file")
            .populate(
                "recipient",
                "firstName middleName lastName email"
            )
            .sort({ createdAt: -1 });

        return res.status(200).json({
            shares
        });

    } catch (error) {

        console.error("Get Shared By Me Error:", error);

        return res.status(500).json({
            message: "Unable to fetch shared files."
        });
    }
};


// 4. Revoke access to a shared file
export const revokeShare = async (req, res) => {
    try {

        const { shareId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(shareId)) {
            return res.status(400).json({
                message: "Invalid share ID."
            });
        }

        const share = await Share.findOne({
            _id: shareId,
            owner: req.userId,
            isActive: true
        });

        if (!share) {
            return res.status(404).json({
                message: "Active share not found."
            });
        }

        share.isActive = false;

        await share.save();

        return res.status(200).json({
            message: "File access revoked successfully."
        });

    } catch (error) {

        console.error("Revoke Share Error:", error);

        return res.status(500).json({
            message: "Unable to revoke file access."
        });
    }
};

// 5. Remove a file shared WITH the logged-in user
export const removeSharedFile = async (req, res) => {
    try {

        const { shareId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(shareId)) {
            return res.status(400).json({
                message: "Invalid share ID."
            });
        }

        // Find a share belonging to the logged-in recipient
        const share = await Share.findOne({
            _id: shareId,
            recipient: req.userId,
            isActive: true
        });

        if (!share) {
            return res.status(404).json({
                message: "Shared file not found."
            });
        }

        // Deactivate this sharing record
        share.isActive = false;

        await share.save();

        return res.status(200).json({
            message: "Shared file removed successfully."
        });

    } catch (error) {

        console.error("Remove Shared File Error:", error);

        return res.status(500).json({
            message: "Unable to remove shared file."
        });
    }
};