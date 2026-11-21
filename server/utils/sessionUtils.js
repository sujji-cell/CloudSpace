import crypto from "crypto";
import Session from "../models/Session.js";
import LoginActivity from "../models/LoginActivity.js";

// ============================================
// DEVICE DETECTION
// ============================================

const detectDevice = (userAgent) => {
    if (/iPad|Tablet/i.test(userAgent)) {
        return "Tablet";
    }

    if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
        return "Mobile";
    }

    return "Desktop";
};


// ============================================
// BROWSER DETECTION
// ============================================

const detectBrowser = (userAgent) => {
    if (/Edg/i.test(userAgent)) {
        return "Microsoft Edge";
    }

    if (/OPR|Opera/i.test(userAgent)) {
        return "Opera";
    }

    if (/SamsungBrowser/i.test(userAgent)) {
        return "Samsung Internet";
    }

    if (/Firefox/i.test(userAgent)) {
        return "Mozilla Firefox";
    }

    if (/Chrome/i.test(userAgent)) {
        return "Google Chrome";
    }

    if (/Safari/i.test(userAgent)) {
        return "Safari";
    }

    return "Unknown";
};


// ============================================
// OPERATING SYSTEM DETECTION
// ============================================

const detectOperatingSystem = (userAgent) => {
    if (/Windows/i.test(userAgent)) {
        return "Windows";
    }

    if (/Android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return "iOS";
    }

    if (/Mac OS X|Macintosh/i.test(userAgent)) {
        return "macOS";
    }

    if (/Linux/i.test(userAgent)) {
        return "Linux";
    }

    return "Unknown";
};
export const createSession = async (userId, req) => {


    try {
        // Generate a unique session ID
        const sessionId = crypto.randomUUID();

        // Set session expiry to 7 days
        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        // Get browser information
        const userAgent = req.headers["user-agent"] || "Unknown";
        // Detect device, browser and operating system
const device = detectDevice(userAgent);
const browser = detectBrowser(userAgent);
const operatingSystem = detectOperatingSystem(userAgent);

        // Get IP address
        const ipAddress =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket.remoteAddress ||
            "Unknown";

        // Create session in MongoDB
       // Create session in MongoDB
const session = await Session.create({
    userId,
    sessionId,
    userAgent,
    ipAddress,
    device,
    browser,
    operatingSystem,
    expiresAt
});

// Record successful login activity
await LoginActivity.create({
    userId,
    sessionId,
    event: "login",
    userAgent,
    ipAddress,
    device,
    browser,
    operatingSystem,
    details: "Successful login."
});

return session;

    } catch (error) {
        console.error("Session creation error:", error);
        throw error;
    }
};