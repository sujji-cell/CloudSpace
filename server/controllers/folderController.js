import mongoose from "mongoose";
import Folder from "../models/Folder.js";
import File from "../models/File.js";

// ============================================
// 1. CREATE FOLDER
// ============================================

export const createFolder = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, parentFolder } = req.body;

        if (name.trim().length > 100) {
    return res.status(400).json({
        success: false,
        message: "Folder name cannot exceed 100 characters."
    });
}

        // Validate parent folder if provided
        if (parentFolder) {
            if (!mongoose.Types.ObjectId.isValid(parentFolder)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent folder ID."
                });
            }

            const parent = await Folder.findOne({
                _id: parentFolder,
                owner: userId
            });

            if (!parent) {
                return res.status(404).json({
                    success: false,
                    message: "Parent folder not found."
                });
            }
        }

        const folder = await Folder.create({
            name: name.trim(),
            owner: userId,
            parentFolder: parentFolder || null
        });

        return res.status(201).json({
            success: true,
            message: "Folder created successfully!",
            folder
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A folder with this name already exists here."
            });
        }

        console.error("Create Folder Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to create folder."
        });
    }
};


// ============================================
// 2. GET USER FOLDERS
// ============================================

export const getUserFolders = async (req, res) => {
    try {
        const userId = req.userId;

        const folders = await Folder.find({
            owner: userId
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: folders.length,
            folders
        });

    } catch (error) {
        console.error("Fetch Folders Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch folders."
        });
    }
};


// ============================================
// 3. RENAME FOLDER
// ============================================

export const renameFolder = async (req, res) => {
    try {
        const userId = req.userId;
        const { folderId } = req.params;
        const { name } = req.body;

        if (!mongoose.Types.ObjectId.isValid(folderId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid folder ID."
            });
        }

        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Folder name is required."
            });
        }
        const folder = await Folder.findOneAndUpdate(
            {
                _id: folderId,
                owner: userId
            },
            {
                $set: { name: name.trim() }
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        );

        if (!folder) {
            return res.status(404).json({
                success: false,
                message: "Folder not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Folder renamed successfully!",
            folder
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A folder with this name already exists here."
            });
        }

        console.error("Rename Folder Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to rename folder."
        });
    }
};


// ============================================
// 4. DELETE FOLDER
// ============================================

export const deleteFolder = async (req, res) => {
    try {
        const userId = req.userId;
        const { folderId } = req.params;

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

        // Do not delete folders containing files
        const hasFiles = await File.exists({
            owner: userId,
            folder: folderId
        });

        // Do not delete folders containing subfolders
        const hasSubfolders = await Folder.exists({
            owner: userId,
            parentFolder: folderId
        });

        if (hasFiles || hasSubfolders) {
            return res.status(400).json({
                success: false,
                message: "Folder is not empty. Move or delete its contents first."
            });
        }

        await folder.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Folder deleted successfully!"
        });

    } catch (error) {
        console.error("Delete Folder Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete folder."
        });
    }
};