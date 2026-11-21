import File from "../models/File.js";
import User from "../models/User.js";

// ============================================
// 1. GET STORAGE OVERVIEW
// ============================================

export const getStorageOverview = async (req, res) => {
    try {
        const userId = req.userId;

        // Get user storage information
        const user = await User.findById(userId).select(
            "storageUsed storageLimit"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        // Get all user's files, including Recycle Bin files
        const files = await File.find({
            owner: userId
        }).select(
            "originalName size mimeType format createdAt isDeleted"
        );

        // Storage calculations
        const totalStorage = user.storageLimit;
        const usedStorage = user.storageUsed;

        const availableStorage = Math.max(
            totalStorage - usedStorage,
            0
        );

        const usagePercentage = totalStorage > 0
            ? Math.min(
                (usedStorage / totalStorage) * 100,
                100
            )
            : 0;

        // Storage breakdown by file category
        const categories = {
            images: 0,
            videos: 0,
            documents: 0,
            audio: 0,
            others: 0
        };

        files.forEach((file) => {
            const mimeType = file.mimeType || "";

            if (mimeType.startsWith("image/")) {
                categories.images += file.size;
            }
            else if (mimeType.startsWith("video/")) {
                categories.videos += file.size;
            }
            else if (mimeType.startsWith("audio/")) {
                categories.audio += file.size;
            }
            else if (
                mimeType.startsWith("application/") ||
                mimeType.startsWith("text/")
            ) {
                categories.documents += file.size;
            }
            else {
                categories.others += file.size;
            }
        });

        // Get largest files
        const largestFiles = [...files]
            .filter((file) => !file.isDeleted)
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        return res.status(200).json({
            success: true,

            storage: {
                totalStorage,
                usedStorage,
                availableStorage,
                usagePercentage
            },

            categories,

            largestFiles
        });

    } catch (error) {
        console.error("Storage Overview Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch storage information."
        });
    }
};