import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";
import mongoose from "mongoose";

import File from "../models/File.js";
import User from "../models/User.js";
import Share from "../models/Share.js";


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

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Check storage limit
        if (user.storageUsed + file.size > user.storageLimit) {
            return res.status(400).json({
                success: false,
                message: "Storage limit exceeded."
            });
        }

        // Upload to Cloudinary using authenticated delivery
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

        // Save file information in MongoDB
        const newFile = await File.create({

            originalName: file.originalname,

            fileUrl: cloudinaryResult.secure_url,

            cloudinaryId: cloudinaryResult.public_id,

            resourceType: cloudinaryResult.resource_type,

            deliveryType: cloudinaryResult.type || "authenticated",

            size: file.size,

            mimeType: file.mimetype,

            format: cloudinaryResult.format || "",

            owner: userId

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

        const files = await File.find({ owner: userId })
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
// 3. DELETE FILE
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

        // Find file belonging to logged-in user
        const file = await File.findOne({

            _id: fileId,

            owner: userId

        });

        if (!file) {

            return res.status(404).json({

                success: false,

                message: "File not found."

            });

        }

        // Determine Cloudinary resource type
        let resourceType = file.resourceType;

        const resourceMatch = file.fileUrl.match(
            /\/(image|video|raw)\/(upload|authenticated)\//
        );

        if (resourceMatch) {

            resourceType = resourceMatch[1];

        } else if (!resourceType) {

            resourceType = file.mimeType.startsWith("video/")
                ? "video"
                : file.mimeType.startsWith("image/")
                    ? "image"
                    : "raw";

        }

        // Determine delivery type
        const deliveryType = file.deliveryType || "upload";

        // Delete actual file from Cloudinary
        const cloudinaryResult = await cloudinary.uploader.destroy(
            file.cloudinaryId,
            {
                resource_type: resourceType,
                type: deliveryType
            }
        );

        // Check Cloudinary response
        if (
            cloudinaryResult.result !== "ok" &&
            cloudinaryResult.result !== "not found"
        ) {

            return res.status(500).json({

                success: false,

                message: "Unable to delete file from cloud storage."

            });

        }

        // Remove sharing records associated with this file
        await Share.deleteMany({
            file: file._id
        });

        // Delete file record from MongoDB
        await file.deleteOne();

        // Decrease user's storage usage
        await User.updateOne(
            { _id: userId },
            { $inc: { storageUsed: -file.size } }
        );

        return res.status(200).json({

            success: true,

            message: "File deleted successfully!"

        });

    } catch (error) {

        console.error("Delete File Error:", error);

        return res.status(500).json({

            success: false,

            message: "Unable to delete file."

        });

    }

};