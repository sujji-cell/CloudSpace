import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
    {
        // Folder name
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: [1, "Folder name cannot be empty."],
            maxlength: [100, "Folder name cannot exceed 100 characters."]
        },

        // Folder owner
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Parent folder (null means root folder)
        parentFolder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Folder",
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate folder names under the same parent for one user
folderSchema.index(
    { owner: 1, parentFolder: 1, name: 1 },
    { unique: true }
);

const Folder = mongoose.model("Folder", folderSchema);

export default Folder;