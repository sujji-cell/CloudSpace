import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        file: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "File",
            required: true
        }
    },
    { timestamps: true }
);

favoriteSchema.index({ user: 1, file: 1 }, { unique: true });

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;