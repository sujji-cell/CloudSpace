import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import mongoose from "mongoose";

import File from "../models/File.js";
import FileVersion from "../models/FileVersion.js";
import User from "../models/User.js";
import Share from "../models/Share.js";


// ============================================
// 1. UPLOAD A NEW VERSION
// ============================================

export const uploadNewVersion = async (req, res) => {
    let cloudinaryResult = null;
    let session = null;

    try {
        const { fileId } = req.params;
        const uploadedFile = req.file;
        const userId = req.userId;

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // Check uploaded file
        if (!uploadedFile) {
            return res.status(400).json({
                success: false,
                message: "Please select a file."
            });
        }

        // Find original file
const file = await File.findOne({
    _id: fileId,
    isDeleted: false
});

if (!file) {
    return res.status(404).json({
        success: false,
        message: "File not found."
    });
}

// Check whether logged-in user is the owner
const isOwner = file.owner.toString() === userId.toString();
const ownerId = file.owner;
if (!isOwner) {

    // Check whether user has editor permission
    const activeShare = await Share.findOne({
        file: file._id,
        recipient: userId,
        isActive: true,
        permission: "editor"
    });

    if (!activeShare) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to upload a new version."
        });
    }
}
        // Find user
        const user = await User.findById(ownerId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Check available storage
        if (
            user.storageUsed + uploadedFile.size >
            user.storageLimit
        ) {
            return res.status(400).json({
                success: false,
                message: "Storage limit exceeded."
            });
        }

        // Upload new version to Cloudinary
        cloudinaryResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `cloudspace/${ownerId}`,
                    resource_type: "auto",
                    type: "authenticated",
                    use_filename: true,
                    unique_filename: true
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            Readable.from(uploadedFile.buffer).pipe(uploadStream);
        });

        // Start MongoDB transaction
        session = await mongoose.startSession();

        await session.withTransaction(async () => {

            // Save previous version in history
            const previousVersion = new FileVersion({
                file: file._id,
                versionNumber: file.currentVersion,

                originalName: file.originalName,

                fileUrl: file.fileUrl,
                cloudinaryId: file.cloudinaryId,

                resourceType: file.resourceType,
                deliveryType: file.deliveryType,

                size: file.size,
                mimeType: file.mimeType,
                format: file.format,

                uploadedBy: userId,
                isCurrent: false
            });

            await previousVersion.save({ session });

            // Update original file with new version details
            file.originalName = uploadedFile.originalname;

            file.fileUrl = cloudinaryResult.secure_url;
            file.cloudinaryId = cloudinaryResult.public_id;

            file.resourceType = cloudinaryResult.resource_type;
            file.deliveryType = cloudinaryResult.type || "authenticated";

            file.size = uploadedFile.size;
            file.mimeType = uploadedFile.mimetype;
            file.format = cloudinaryResult.format || "";

            file.currentVersion += 1;

            await file.save({ session });

            // Atomically update storage usage
            const updatedUser = await User.findOneAndUpdate(
                {
                   _id: ownerId,
                    $expr: {
                        $lte: [
                            {
                                $add: [
                                    "$storageUsed",
                                    uploadedFile.size
                                ]
                            },
                            "$storageLimit"
                        ]
                    }
                },
                {
                    $inc: {
                        storageUsed: uploadedFile.size
                    }
                },
                {
                    returnDocument: "after",
                    session
                }
            );

            if (!updatedUser) {
                const error = new Error("Storage limit exceeded.");
                error.statusCode = 400;
                throw error;
            }
        });

        return res.status(200).json({
            success: true,
            message: "New file version uploaded successfully.",
            file
        });

    } catch (error) {

        // Clean up Cloudinary asset if database operation failed
        if (cloudinaryResult?.public_id) {
            try {
                await cloudinary.uploader.destroy(
                    cloudinaryResult.public_id,
                    {
                        resource_type: cloudinaryResult.resource_type || "raw",
                        type: cloudinaryResult.type || "authenticated"
                    }
                );
            } catch (cleanupError) {
                console.error(
                    "Cloudinary cleanup error:",
                    cleanupError
                );
            }
        }

        console.error("Upload new version error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to upload new version."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};


// ============================================
// 2. GET FILE VERSION HISTORY
// ============================================

export const getVersionHistory = async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.userId;

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // Find original file
        const file = await File.findOne({
    _id: fileId,
    isDeleted: false
});

if (!file) {
    return res.status(404).json({
        success: false,
        message: "File not found."
    });
}

const isOwner = file.owner.toString() === userId.toString();

if (!isOwner) {
    const activeShare = await Share.findOne({
        file: file._id,
        recipient: userId,
        isActive: true
    });

    if (!activeShare) {
        return res.status(403).json({
            success: false,
            message: "You do not have permission to view this file's version history."
        });
    }
}

        // Get previous versions
        const previousVersions = await FileVersion.find({
            file: fileId
        })
            .populate("uploadedBy", "firstName lastName email")
            .sort({ versionNumber: -1 });

        // Create current version object
        const currentVersion = {
            _id: file._id,
            file: file._id,

            versionNumber: file.currentVersion,

            originalName: file.originalName,

            fileUrl: file.fileUrl,
            cloudinaryId: file.cloudinaryId,

            resourceType: file.resourceType,
            deliveryType: file.deliveryType,

            size: file.size,
            mimeType: file.mimeType,
            format: file.format,

            uploadedBy: userId,
            isCurrent: true,

            createdAt: file.updatedAt
        };

        // Combine current and previous versions
        const versions = [
            currentVersion,
            ...previousVersions
        ];

        // Sort newest first
        versions.sort(
            (a, b) => b.versionNumber - a.versionNumber
        );

        return res.status(200).json({
            success: true,
            totalVersions: versions.length,
            currentVersion: file.currentVersion,
            versions
        });

    } catch (error) {
        console.error("Get version history error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve version history."
        });
    }
};


// ============================================
// 3. RESTORE A PREVIOUS VERSION
// ============================================

export const restoreVersion = async (req, res) => {
    let session = null;

    try {
        const { fileId, versionNumber } = req.params;
        const userId = req.userId;

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // Find original file
        const file = await File.findOne({
            _id: fileId,
            owner: userId,
            isDeleted: false
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found."
            });
        }

        // Convert version number
        const requestedVersion = Number(versionNumber);

        // Validate version number
        if (
            !Number.isInteger(requestedVersion) ||
            requestedVersion < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid version number."
            });
        }

        // Check whether requested version is already current
        if (requestedVersion === file.currentVersion) {
            return res.status(400).json({
                success: false,
                message: "This version is already current."
            });
        }

        // Find requested historical version
        const oldVersion = await FileVersion.findOne({
            file: fileId,
            versionNumber: requestedVersion
        });

        if (!oldVersion) {
            return res.status(404).json({
                success: false,
                message: "Requested version not found."
            });
        }

        // Start MongoDB transaction
        session = await mongoose.startSession();

        await session.withTransaction(async () => {

            // Save current version in history
            const currentVersionHistory = new FileVersion({
                file: file._id,

                versionNumber: file.currentVersion,

                originalName: file.originalName,

                fileUrl: file.fileUrl,
                cloudinaryId: file.cloudinaryId,

                resourceType: file.resourceType,
                deliveryType: file.deliveryType,

                size: file.size,
                mimeType: file.mimeType,
                format: file.format,

                uploadedBy: userId,
                isCurrent: false
            });

            await currentVersionHistory.save({ session });

            // Restore selected version details
            file.originalName = oldVersion.originalName;

            file.fileUrl = oldVersion.fileUrl;
            file.cloudinaryId = oldVersion.cloudinaryId;

            file.resourceType = oldVersion.resourceType;
            file.deliveryType = oldVersion.deliveryType;

            file.size = oldVersion.size;
            file.mimeType = oldVersion.mimeType;
            file.format = oldVersion.format;

            // Restoration creates a new version number
            file.currentVersion += 1;

            await file.save({ session });
        });

        return res.status(200).json({
            success: true,
            message: "Previous version restored successfully.",
            currentVersion: file.currentVersion,
            file
        });

    } catch (error) {
        console.error("Restore version error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to restore file version."
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};
