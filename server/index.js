import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import recycleBinRoutes from "./routes/recycleBinRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import uploadErrorMiddleware from "./middleware/uploadErrorMiddleware.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
dotenv.config();

const app = express();

// Middleware

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Test Route

app.get("/", (req, res) => {
    res.send("CloudSpace Server is Running!");
});



// Authentication Routes

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);

// Share File
app.use("/api/shares", shareRoutes);

// Favorite Files
app.use("/api/favorites", favoriteRoutes);

// Folder Management
app.use("/api/folders", folderRoutes);

// Recycle Bin
app.use("/api/recycle-bin", recycleBinRoutes);

// Notifications
app.use("/api/notifications", notificationRoutes);

// Session Management
app.use("/api/sessions", sessionRoutes);

// Upload Error Handling
app.use(uploadErrorMiddleware);

// Global Error Handling
app.use(errorMiddleware);

// Start Server

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

startServer();