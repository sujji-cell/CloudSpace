import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

import File from "../models/File.js";
import Share from "../models/Share.js";

export const getFileAccessUrl = async (req, res) => {

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

        // Find file
        const file = await File.findById(fileId);

        if (!file) {

            return res.status(404).json({
                success: false,
                message: "File not found."
            });

        }

        // Check ownership
        const isOwner =
            file.owner.toString() === userId.toString();

        // Check sharing permission
        if (!isOwner) {

            const activeShare = await Share.findOne({
                file: file._id,
                recipient: userId,
                isActive: true
            });

            if (!activeShare) {

                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to access this file."
                });

            }

        }

        // Determine resource type
        let resourceType = file.resourceType || "raw";

        const resourceMatch = file.fileUrl.match(
            /\/(image|video|raw)\/(upload|authenticated)\//
        );

        if (resourceMatch) {
            resourceType = resourceMatch[1];
        }

        // Determine delivery type
        const deliveryType = file.deliveryType || "upload";

        let accessUrl;

        if (deliveryType === "authenticated") {

            // Generate a URL valid for five minutes
            const expiresAt = Math.floor(Date.now() / 1000) + 300;

            const format =
                file.format ||
                file.originalName.split(".").pop();

            accessUrl = cloudinary.utils.private_download_url(
                file.cloudinaryId,
                format,
                {
                    resource_type: resourceType,
                    type: "authenticated",
                    expires_at: expiresAt
                }
            );

        } else {

            // Existing public files
            accessUrl = file.fileUrl;

        }

        // Update last accessed date
        file.lastAccessedAt = new Date();

        await file.save();

        return res.status(200).json({

            success: true,

            message: "File access granted.",

            accessUrl,

            lastAccessedAt: file.lastAccessedAt

        });

    } catch (error) {

        console.error("File Access Error:", error);

        return res.status(500).json({

            success: false,

            message: "Unable to access file."

        });

    }

};