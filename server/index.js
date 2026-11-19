import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import shareRoutes from "./routes/shareRoutes.js";
import favoriteRoutes from "./routes/favoriteRoutes.js";
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