import File from "../models/File.js";
import FileVersion from "../models/FileVersion.js";
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
            "originalName size mimeType format createdAt isDeleted cloudinaryId"
        );

        // Get all historical versions belonging to user's files
        const fileIds = files.map((file) => file._id);

        const previousVersions = await FileVersion.find({
            file: { $in: fileIds }
        }).select(
            "originalName size mimeType format createdAt cloudinaryId"
        );

        // ============================================
        // STORAGE CALCULATIONS
        // ============================================

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

        // ============================================
        // COMBINE CURRENT AND PREVIOUS VERSIONS
        // ============================================

        const allStoredVersions = [
            ...files,
            ...previousVersions
        ];

        // Prevent counting the same Cloudinary asset twice.
        // This is especially important after restoring a version.
        const uniqueAssets = new Map();

        allStoredVersions.forEach((item, index) => {
            const assetKey = item.cloudinaryId
                ? item.cloudinaryId
                : `${item._id || index}`;

            if (!uniqueAssets.has(assetKey)) {
                uniqueAssets.set(assetKey, item);
            }
        });

        const uniqueStoredFiles = Array.from(
            uniqueAssets.values()
        );

        // ============================================
        // STORAGE BREAKDOWN BY CATEGORY
        // ============================================

        const categories = {
            images: 0,
            videos: 0,
            documents: 0,
            audio: 0,
            others: 0
        };

        uniqueStoredFiles.forEach((file) => {
            const mimeType = file.mimeType || "";
            const size = file.size || 0;

            if (mimeType.startsWith("image/")) {
                categories.images += size;
            }
            else if (mimeType.startsWith("video/")) {
                categories.videos += size;
            }
            else if (mimeType.startsWith("audio/")) {
                categories.audio += size;
            }
            else if (
                mimeType.startsWith("application/") ||
                mimeType.startsWith("text/")
            ) {
                categories.documents += size;
            }
            else {
                categories.others += size;
            }
        });

        // ============================================
        // GET LARGEST CURRENT FILES
        // ============================================

        const largestFiles = files
            .filter((file) => !file.isDeleted)
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);

        // ============================================
        // RESPONSE
        // ============================================

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