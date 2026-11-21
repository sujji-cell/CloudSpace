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
            isDeleted: true
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

        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        const file = await File.findOne({
            _id: fileId,
            owner: userId,
            isDeleted: true
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "Deleted file not found."
            });
        }

        // Check whether the original folder still exists
        if (file.folder) {
            const folderExists = await Folder.exists({
                _id: file.folder,
                owner: userId
            });

            // Restore to root if original folder no longer exists
            if (!folderExists) {
                file.folder = null;
            }
        }

        // Restore file
        file.isDeleted = false;
        file.deletedAt = null;

        await file.save();

        return res.status(200).json({
            success: true,
            message: "File restored successfully!",
            file
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

        // Find deleted file belonging to logged-in user
        const file = await File.findOne({
            _id: fileId,
            owner: userId,
            isDeleted: true
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "Deleted file not found."
            });
        }

        // Get all previous versions
        const previousVersions = await FileVersion.find({
            file: file._id
        });

        // Combine current file and previous versions
        const allVersions = [
            file,
            ...previousVersions
        ];

        // Remove duplicate Cloudinary assets.
        // Restoring a version can cause multiple records
        // to reference the same Cloudinary asset.
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

        // Delete every unique version from Cloudinary
        for (const asset of assetsToDelete) {

            // Skip records without a Cloudinary ID
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
                return res.status(500).json({
                    success: false,
                    message: "Unable to delete all file versions from cloud storage."
                });
            }
        }

        // Remove associated sharing records
        await Share.deleteMany({
            file: file._id
        });

        // Remove associated favourite records
        await Favorite.deleteMany({
            file: file._id
        });

        // Remove all historical version records
        await FileVersion.deleteMany({
            file: file._id
        });

        // Delete original file database record
        await file.deleteOne();

        // Update user's storage usage
        const user = await User.findById(userId);

        if (user) {
            user.storageUsed = Math.max(
                0,
                user.storageUsed - totalDeletedStorage
            );

            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "File and all its versions permanently deleted successfully!"
        });

    } catch (error) {
        console.error("Permanent Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to permanently delete file."
        });
    }
};