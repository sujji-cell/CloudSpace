import mongoose from "mongoose";

import File from "../models/File.js";
import FileVersion from "../models/FileVersion.js";
import Folder from "../models/Folder.js";

import cloudinary from "../config/cloudinary.js";

import User from "../models/User.js";
import Share from "../models/Share.js";
import Favorite from "../models/Favorite.js";


// ============================================
// 1. GET RECYCLE BIN FILES
// ============================================

export const getRecycleBinFiles = async (req, res) => {
    try {
        const userId = req.userId;

        const files = await File.find({
    owner: userId,
    isDeleted: true,
    isDeleting: { $ne: true }
})
            .populate("folder", "name")
            .sort({ deletedAt: -1 });

        return res.status(200).json({
            success: true,
            count: files.length,
            files
        });

    } catch (error) {
        console.error("Recycle Bin Fetch Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch Recycle Bin files."
        });
    }
};


// ============================================
// 2. RESTORE FILE
// ============================================

export const restoreFile = async (req, res) => {

    try {

        const userId = req.userId;
        const { fileId } = req.params;

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // Find deleted file
        const file = await File.findOne({
            _id: fileId,
            owner: userId,
            isDeleted: true,
            isDeleting: { $ne: true }
        });

        if (!file) {

            const existingFile = await File.findOne({
                _id: fileId,
                owner: userId,
                isDeleted: true
            });

            if (existingFile?.isDeleting) {
                return res.status(409).json({
                    success: false,
                    message: "This file is currently being permanently deleted."
                });
            }

            return res.status(404).json({
                success: false,
                message: "Deleted file not found."
            });
        }

        // Check whether original folder still exists
        let folderId = file.folder;

        if (folderId) {

            const folderExists = await Folder.exists({
                _id: folderId,
                owner: userId
            });

            // Restore to root if original folder no longer exists
            if (!folderExists) {
                folderId = null;
            }
        }

        // Atomically restore the file
        const restoredFile = await File.findOneAndUpdate(
            {
                _id: fileId,
                owner: userId,
                isDeleted: true,
                isDeleting: { $ne: true }
            },
            {
                $set: {
                    isDeleted: false,
                    deletedAt: null,
                    folder: folderId
                }
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!restoredFile) {
            return res.status(409).json({
                success: false,
                message: "Unable to restore file. It may be undergoing deletion."
            });
        }

        return res.status(200).json({
            success: true,
            message: "File restored successfully!",
            file: restoredFile
        });

    } catch (error) {

        console.error("Restore File Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to restore file."
        });
    }
};

// ============================================
// 3. PERMANENTLY DELETE FILE
// ============================================

export const permanentlyDeleteFile = async (req, res) => {

    let lockedFileId = null;

    try {

        const userId = req.userId;
        const { fileId } = req.params;

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // ============================================
        // 1. ACQUIRE ATOMIC DELETION LOCK
        // ============================================

        const file = await File.findOneAndUpdate(
            {
                _id: fileId,
                owner: userId,
                isDeleted: true,
                isDeleting: { $ne: true }
            },
            {
                $set: {
                    isDeleting: true
                }
            },
            {
                new: true
            }
        );

        if (!file) {

            // Check whether another request is deleting it
            const existingFile = await File.findOne({
                _id: fileId,
                owner: userId,
                isDeleted: true
            });

            if (existingFile?.isDeleting) {
                return res.status(409).json({
                    success: false,
                    message: "This file is already being permanently deleted."
                });
            }

            return res.status(404).json({
                success: false,
                message: "Deleted file not found."
            });
        }

        // Remember the locked file so we can release the lock on failure
        lockedFileId = file._id;

        // ============================================
        // 2. GET ALL FILE VERSIONS
        // ============================================

        const previousVersions = await FileVersion.find({
            file: file._id
        });

        const allVersions = [
            file,
            ...previousVersions
        ];

        // ============================================
        // 3. REMOVE DUPLICATE CLOUDINARY ASSETS
        // ============================================

        const uniqueAssets = new Map();

        allVersions.forEach((version, index) => {

            const assetKey = version.cloudinaryId
                ? version.cloudinaryId
                : `${version._id || index}`;

            if (!uniqueAssets.has(assetKey)) {
                uniqueAssets.set(assetKey, version);
            }

        });

        const assetsToDelete = Array.from(
            uniqueAssets.values()
        );

        // Calculate total storage occupied by unique assets
        const totalDeletedStorage = assetsToDelete.reduce(
            (total, asset) => total + (asset.size || 0),
            0
        );

        // ============================================
        // 4. DELETE ASSETS FROM CLOUDINARY
        // ============================================

        for (const asset of assetsToDelete) {

            if (!asset.cloudinaryId) {
                continue;
            }

            let resourceType = asset.resourceType;

            if (!["image", "video", "raw"].includes(resourceType)) {

                const mimeType = asset.mimeType || "";

                resourceType = mimeType.startsWith("video/")
                    ? "video"
                    : mimeType.startsWith("image/")
                        ? "image"
                        : "raw";
            }

            const deliveryType = asset.deliveryType || "upload";

            const result = await cloudinary.uploader.destroy(
                asset.cloudinaryId,
                {
                    resource_type: resourceType,
                    type: deliveryType
                }
            );

            // Accept successful deletion or an already missing asset
            if (
                result.result !== "ok" &&
                result.result !== "not found"
            ) {
                throw new Error(
                    "Unable to delete all file versions from cloud storage."
                );
            }
        }

        // ============================================
        // 5. DATABASE CLEANUP USING TRANSACTION
        // ============================================

        const session = await mongoose.startSession();

        try {

            await session.withTransaction(async () => {

                // Verify the locked file still exists
                const lockedFile = await File.findOne({
                    _id: file._id,
                    owner: userId,
                    isDeleted: true,
                    isDeleting: true
                }).session(session);

                if (!lockedFile) {
                    throw new Error("File deletion lock was lost.");
                }

                // Remove associated sharing records
                await Share.deleteMany(
                    { file: file._id },
                    { session }
                );

                // Remove associated favourite records
                await Favorite.deleteMany(
                    { file: file._id },
                    { session }
                );

                // Remove historical version records
                await FileVersion.deleteMany(
                    { file: file._id },
                    { session }
                );

                // Delete original file database record
                await File.deleteOne(
                    {
                        _id: file._id,
                        owner: userId,
                        isDeleting: true
                    },
                    { session }
                );

                // Update user's storage usage
                const user = await User.findById(userId).session(session);

                if (user) {

                    user.storageUsed = Math.max(
                        0,
                        user.storageUsed - totalDeletedStorage
                    );

                    await user.save({ session });
                }

            });

        } finally {

            await session.endSession();

        }

        // File has been deleted, so no lock needs releasing
        lockedFileId = null;

        return res.status(200).json({
            success: true,
            message: "File and all its versions permanently deleted successfully!"
        });

    } catch (error) {

        console.error("Permanent Delete Error:", error);

        // ============================================
        // 6. RELEASE LOCK IF DELETION FAILED
        // ============================================

        if (lockedFileId) {

            try {

                await File.updateOne(
                    {
                        _id: lockedFileId,
                        owner: req.userId,
                        isDeleting: true
                    },
                    {
                        $set: {
                            isDeleting: false
                        }
                    }
                );

            } catch (lockError) {

                console.error(
                    "Failed to release file deletion lock:",
                    lockError
                );

            }
        }

        return res.status(500).json({
            success: false,
            message: "Unable to permanently delete file."
        });
    }
};