import mongoose from "mongoose";

import Favorite from "../models/Favorite.js";
import File from "../models/File.js";
import Share from "../models/Share.js";

// ADD FILE TO FAVOURITES

export const addFavorite = async (req, res) => {

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

        // Check whether file exists
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
                file: fileId,
                recipient: userId,
                isActive: true
            });

            if (!activeShare) {

                return res.status(403).json({
                    success: false,
                    message: "You do not have permission to favourite this file."
                });

            }

        }

        // Check existing favourite
        const existingFavorite = await Favorite.findOne({
            user: userId,
            file: fileId
        });

        if (existingFavorite) {

            return res.status(200).json({
                success: true,
                message: "File is already in favourites.",
                favorite: existingFavorite
            });

        }

        // Create favourite
        const favorite = await Favorite.create({
            user: userId,
            file: fileId
        });

        return res.status(201).json({
            success: true,
            message: "File added to favourites.",
            favorite
        });

    } catch (error) {

        console.error("Add Favorite Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to add file to favourites."
        });

    }

};


// GET USER FAVOURITES

export const getFavorites = async (req, res) => {

    try {

        const userId = req.userId;

        const favorites = await Favorite.find({
            user: userId
        })
            .populate("file")
            .sort({ createdAt: -1 });

        // Remove files that no longer exist or are no longer accessible
        const accessibleFavorites = [];

        for (const favorite of favorites) {

            const file = favorite.file;

            if (!file) {
                continue;
            }

            const isOwner =
                file.owner.toString() === userId.toString();

            if (isOwner) {
                accessibleFavorites.push(favorite);
                continue;
            }

            const activeShare = await Share.findOne({
                file: file._id,
                recipient: userId,
                isActive: true
            });

            if (activeShare) {
                accessibleFavorites.push(favorite);
            }

        }

        return res.status(200).json({
            success: true,
            favorites: accessibleFavorites
        });

    } catch (error) {

        console.error("Get Favorites Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to fetch favourites."
        });

    }

};


// REMOVE FILE FROM FAVOURITES

export const removeFavorite = async (req, res) => {

    try {

        const { fileId } = req.params;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(fileId)) {

            return res.status(400).json({
                success: false,
                message: "Invalid file ID."
            });

        }

        const favorite = await Favorite.findOneAndDelete({
            user: userId,
            file: fileId
        });

        if (!favorite) {

            return res.status(404).json({
                success: false,
                message: "Favourite not found."
            });

        }

        return res.status(200).json({
            success: true,
            message: "File removed from favourites."
        });

    } catch (error) {

        console.error("Remove Favorite Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove favourite."
        });

    }

};