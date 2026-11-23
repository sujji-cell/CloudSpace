
import mongoose from "mongoose";

import Share from "../models/Share.js";
import File from "../models/File.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";


// ============================================
// 1. SHARE A FILE WITH ANOTHER USER
// ============================================

export const shareFile = async (req, res) => {

    try {

        const { fileId, email, permission = "viewer" } = req.body;

        const ownerId = req.userId;

        // ============================================
        // VALIDATE INPUT
        // ============================================

        if (
            typeof fileId !== "string" ||
            typeof email !== "string" ||
            !fileId.trim() ||
            !email.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "File ID and recipient email are required."
            });

        }

        const normalizedFileId = fileId.trim();

        const normalizedEmail = email.trim().toLowerCase();

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(normalizedFileId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });

        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {

            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });

        }

        // Validate permission
        if (!["viewer", "editor"].includes(permission)) {

            return res.status(400).json({
                success: false,
                message: "Permission must be either viewer or editor."
            });

        }


        // ============================================
        // FIND FILE
        // ============================================

        const file = await File.findOne({
            _id: normalizedFileId,
            owner: ownerId,
            isDeleted: false
        });

        if (!file) {

            return res.status(404).json({
                success: false,
                message: "File not found or you do not own this file."
            });

        }


        // ============================================
        // FIND RECIPIENT
        // ============================================

        const recipient = await User.findOne({
            email: normalizedEmail
        });

        if (!recipient) {

            return res.status(404).json({
                success: false,
                message: "No CloudSpace account found with this email."
            });

        }

        // Require verified email
        if (!recipient.isVerified) {

            return res.status(403).json({
                success: false,
                message: "Recipient must verify their email first."
            });

        }

        // Prevent sharing with yourself
        if (recipient._id.toString() === ownerId.toString()) {

            return res.status(400).json({
                success: false,
                message: "You cannot share a file with yourself."
            });

        }


        // ============================================
        // CREATE OR REACTIVATE SHARE
        // ============================================

        const existingShare = await Share.findOne({
            file: normalizedFileId,
            recipient: recipient._id
        });

        if (existingShare) {

            // Prevent duplicate active sharing
            if (existingShare.isActive) {

                return res.status(409).json({
                    success: false,
                    message: "This file is already shared with this user."
                });

            }

            // Reactivate previously revoked sharing
            existingShare.owner = ownerId;
            existingShare.permission = permission;
            existingShare.isActive = true;

            await existingShare.save();

        } else {

            // Create new sharing record
            await Share.create({
                file: normalizedFileId,
                owner: ownerId,
                recipient: recipient._id,
                permission
            });

        }


        // ============================================
        // CREATE IN-APP NOTIFICATION
        // ============================================

        try {

            const notificationsEnabled =
                recipient.notificationPreferences
                    ?.inApp
                    ?.sharedFileUpdates !== false;

            if (notificationsEnabled) {

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

            // Notification failure must not affect file sharing
            console.error(
                "Notification creation failed:",
                notificationError
            );

        }


        // ============================================
        // SUCCESS RESPONSE
        // ============================================

        return res.status(200).json({

            success: true,

            message: `File shared successfully with ${recipient.email}.`

        });

    } catch (error) {

        console.error("Share File Error:", error);

        // Handle duplicate-key errors
        if (error.code === 11000) {

            return res.status(409).json({
                success: false,
                message: "This file is already shared with this user."
            });

        }

        return res.status(500).json({
            success: false,
            message: "Unable to share file."
        });

    }

};


// ============================================
// SAFE FILE FIELDS FOR SHARED FILE LISTS
// ============================================

const safeFileFields = [
    "originalName",
    "resourceType",
    "size",
    "mimeType",
    "format",
    "currentVersion",
    "createdAt",
    "updatedAt"
].join(" ");


// ============================================
// 2. GET FILES SHARED WITH THE LOGGED-IN USER
// ============================================

export const getSharedWithMe = async (req, res) => {

    try {

        const shares = await Share.find({
            recipient: req.userId,
            isActive: true
        })

            .populate({
                path: "file",
                select: safeFileFields,
                match: {
                    isDeleted: false
                }
            })

            .populate(
                "owner",
                "firstName middleName lastName email"
            )

            .sort({
                createdAt: -1,
                _id: -1
            });

        // Remove shares whose files are deleted or unavailable
        const activeShares = shares.filter(
            share => share.file !== null
        );

        return res.status(200).json({

            success: true,

            shares: activeShares

        });

    } catch (error) {

        console.error("Get Shared Files Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch shared files."
        });

    }

};


// ============================================
// 3. GET FILES SHARED BY THE LOGGED-IN USER
// ============================================

export const getSharedByMe = async (req, res) => {

    try {

        const shares = await Share.find({
            owner: req.userId,
            isActive: true
        })

            .populate({
                path: "file",
                select: safeFileFields,
                match: {
                    isDeleted: false
                }
            })

            .populate(
                "recipient",
                "firstName middleName lastName email"
            )

            .sort({
                createdAt: -1,
                _id: -1
            });

        // Remove shares whose files are deleted or unavailable
        const activeShares = shares.filter(
            share => share.file !== null
        );

        return res.status(200).json({

            success: true,

            shares: activeShares

        });

    } catch (error) {

        console.error("Get Shared By Me Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch shared files."
        });

    }

};


// ============================================
// 4. REVOKE ACCESS TO A SHARED FILE
// ============================================

export const revokeShare = async (req, res) => {

    try {

        const { shareId } = req.params;

        // Validate share ID
        if (!mongoose.Types.ObjectId.isValid(shareId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid share ID."
            });

        }

        // Find active share belonging to owner
        const share = await Share.findOneAndUpdate(
            {
                _id: shareId,
                owner: req.userId,
                isActive: true
            },
            {
                $set: {
                    isActive: false
                }
            },
            {
                new: true
            }
        );

        if (!share) {

            return res.status(404).json({
                success: false,
                message: "Active share not found."
            });

        }

        return res.status(200).json({

            success: true,

            message: "File access revoked successfully."

        });

    } catch (error) {

        console.error("Revoke Share Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to revoke file access."
        });

    }

};


// ============================================
// 5. REMOVE A FILE SHARED WITH THE LOGGED-IN USER
// ============================================

export const removeSharedFile = async (req, res) => {

    try {

        const { shareId } = req.params;

        // Validate share ID
        if (!mongoose.Types.ObjectId.isValid(shareId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid share ID."
            });

        }

        // Find and deactivate share belonging to recipient
        const share = await Share.findOneAndUpdate(
            {
                _id: shareId,
                recipient: req.userId,
                isActive: true
            },
            {
                $set: {
                    isActive: false
                }
            },
            {
                new: true
            }
        );

        if (!share) {

            return res.status(404).json({
                success: false,
                message: "Shared file not found."
            });

        }

        return res.status(200).json({

            success: true,

            message: "Shared file removed successfully."

        });

    } catch (error) {

        console.error("Remove Shared File Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove shared file."
        });

    }

};
