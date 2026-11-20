import mongoose from "mongoose";
import File from "../models/File.js";
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

        // Determine Cloudinary resource type
        let resourceType = file.resourceType;

        if (!["image", "video", "raw"].includes(resourceType)) {
            resourceType = file.mimeType.startsWith("video/")
                ? "video"
                : file.mimeType.startsWith("image/")
                    ? "image"
                    : "raw";
        }

        // Determine delivery type
        const deliveryType = file.deliveryType || "upload";

        // Permanently delete from Cloudinary
        const cloudinaryResult = await cloudinary.uploader.destroy(
            file.cloudinaryId,
            {
                resource_type: resourceType,
                type: deliveryType
            }
        );

        // Verify Cloudinary deletion
        if (
            cloudinaryResult.result !== "ok" &&
            cloudinaryResult.result !== "not found"
        ) {
            return res.status(500).json({
                success: false,
                message: "Unable to permanently delete file from cloud storage."
            });
        }

        // Remove associated sharing records
        await Share.deleteMany({
            file: file._id
        });

        // Remove associated favourite records
        await Favorite.deleteMany({
            file: file._id
        });

        // Delete database record
        await file.deleteOne();

        // Decrease storage usage
        await User.updateOne(
            { _id: userId },
            { $inc: { storageUsed: -file.size } }
        );

        return res.status(200).json({
            success: true,
            message: "File permanently deleted successfully!"
        });

    } catch (error) {
        console.error("Permanent Delete Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to permanently delete file."
        });
    }
};