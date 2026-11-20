import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import mongoose from "mongoose";

import File from "../models/File.js";
import User from "../models/User.js";
import Share from "../models/Share.js";
import Folder from "../models/Folder.js";

// ============================================
// 1. UPLOAD FILE
// ============================================

export const uploadFile = async (req, res) => {
    let uploadedAsset = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please select a file to upload."
            });
        }

        const userId = req.userId;
        const file = req.file;
        const { folderId } = req.body;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        let selectedFolder = null;

        if (folderId) {
            if (!mongoose.Types.ObjectId.isValid(folderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid folder ID."
                });
            }

            selectedFolder = await Folder.findOne({
                _id: folderId,
                owner: userId
            });

            if (!selectedFolder) {
                return res.status(404).json({
                    success: false,
                    message: "Folder not found."
                });
            }
        }

        // Check storage limit
        if (user.storageUsed + file.size > user.storageLimit) {
            return res.status(400).json({
                success: false,
                message: "Storage limit exceeded."
            });
        }

        // Upload to Cloudinary
        const cloudinaryResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `cloudspace/${userId}`,
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

            Readable.from([file.buffer]).pipe(uploadStream);
        });

        uploadedAsset = cloudinaryResult;

        // Save file information
        const newFile = await File.create({
            originalName: file.originalname,
            fileUrl: cloudinaryResult.secure_url,
            cloudinaryId: cloudinaryResult.public_id,
            resourceType: cloudinaryResult.resource_type,
            deliveryType: cloudinaryResult.type || "authenticated",
            size: file.size,
            mimeType: file.mimetype,
            format: cloudinaryResult.format || "",
            owner: userId,
            folder: selectedFolder ? selectedFolder._id : null
        });

        // Update storage usage
        user.storageUsed += file.size;
        await user.save();

        return res.status(201).json({
            success: true,
            message: "File uploaded successfully!",
            file: newFile
        });

    } catch (error) {
        // Cleanup Cloudinary if database operation fails
        if (uploadedAsset) {
            try {
                await cloudinary.uploader.destroy(
                    uploadedAsset.public_id,
                    {
                        resource_type: uploadedAsset.resource_type,
                        type: uploadedAsset.type || "authenticated"
                    }
                );
            } catch (cleanupError) {
                console.error("Cloudinary cleanup failed:", cleanupError);
            }
        }

        console.error("File Upload Error:", error);

        return res.status(500).json({
            success: false,
            message: "File upload failed."
        });
    }
};


// ============================================
// 2. GET USER FILES
// ============================================

export const getUserFiles = async (req, res) => {
    try {
        const userId = req.userId;
        const { folderId, root } = req.query;

        // Exclude files in Recycle Bin
        const filter = {
            owner: userId,
            isDeleted: { $ne: true }
        };

        // Files inside a specific folder
        if (folderId) {
            if (!mongoose.Types.ObjectId.isValid(folderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid folder ID."
                });
            }

            const folder = await Folder.findOne({
                _id: folderId,
                owner: userId
            });

            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: "Folder not found."
                });
            }

            filter.folder = folderId;
        }

        // Files in root directory
        else if (root === "true") {
            filter.folder = null;
        }

        const files = await File.find(filter)
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: files.length,
            files
        });

    } catch (error) {
        console.error("Fetch Files Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch files."
        });
    }
};


// ============================================
// 3. MOVE FILE
// ============================================

export const moveFile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fileId } = req.params;
        const { folderId } = req.body;

        // Validate file ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // Find active file belonging to logged-in user
        const file = await File.findOne({
            _id: fileId,
            owner: userId,
            isDeleted: { $ne: true }
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found."
            });
        }

        let selectedFolder = null;

        // Validate destination folder
        if (folderId) {
            if (!mongoose.Types.ObjectId.isValid(folderId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid destination folder ID."
                });
            }

            selectedFolder = await Folder.findOne({
                _id: folderId,
                owner: userId
            });

            if (!selectedFolder) {
                return res.status(404).json({
                    success: false,
                    message: "Destination folder not found."
                });
            }
        }

        // Prevent unnecessary move
        const currentFolderId = file.folder
            ? String(file.folder)
            : null;

        const destinationFolderId = selectedFolder
            ? String(selectedFolder._id)
            : null;

        if (currentFolderId === destinationFolderId) {
            return res.status(400).json({
                success: false,
                message: "File is already in this location."
            });
        }

        // Move file
        file.folder = selectedFolder
            ? selectedFolder._id
            : null;

        await file.save();

        return res.status(200).json({
            success: true,
            message: selectedFolder
                ? "File moved to folder successfully!"
                : "File moved to My Files successfully!",
            file
        });

    } catch (error) {
        console.error("Move File Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to move file."
        });
    }
};


// ============================================
// 4. SOFT DELETE FILE
// ============================================

export const deleteFile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fileId } = req.params;

        // Validate MongoDB ID
        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });
        }

        // Find active file belonging to logged-in user
        const file = await File.findOne({
            _id: fileId,
            owner: userId,
            isDeleted: { $ne: true }
        });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: "File not found."
            });
        }

        // Move file to Recycle Bin
        file.isDeleted = true;
        file.deletedAt = new Date();

        await file.save();

        return res.status(200).json({
            success: true,
            message: "File moved to Recycle Bin successfully!",
            file
        });

    } catch (error) {
        console.error("Soft Delete File Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to move file to Recycle Bin."
        });
    }
};