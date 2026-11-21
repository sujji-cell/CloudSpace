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

const detectBrowser = (userAgent, clientBrowser) => {

    // Detect browsers identified by the frontend
    if (clientBrowser === "Brave") return "Brave";
    if (clientBrowser === "Vivaldi") return "Vivaldi";

    // Detect browsers using User-Agent
    if (/Edg/i.test(userAgent)) return "Microsoft Edge";
    if (/OPR|Opera/i.test(userAgent)) return "Opera";
    if (/SamsungBrowser/i.test(userAgent)) return "Samsung Internet";
    if (/Firefox/i.test(userAgent)) return "Mozilla Firefox";
    if (/Chrome/i.test(userAgent)) return "Google Chrome";
    if (/Safari/i.test(userAgent)) return "Safari";

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

// ============================================
// NEW DEVICE DETECTION
// ============================================

export const isNewDevice = async (
    userId,
    device,
    browser,
    operatingSystem
) => {

    const existingSession = await Session.findOne({
        userId,
        device,
        browser,
        operatingSystem
    }).select("_id");

    return !existingSession;
};

// ============================================
// CREATE SESSION
// ============================================

export const createSession = async (userId, req) => {

    try {

        const sessionId = crypto.randomUUID();

        // Session expires after 7 days
        const expiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        // Get user agent
        const userAgent = req.headers["user-agent"] || "Unknown";

        // Get browser identification from frontend
        const clientBrowser = req.headers["x-client-browser"];

        // Detect device information
        const device = detectDevice(userAgent);

        const browser = detectBrowser(
            userAgent,
            clientBrowser
        );

        const operatingSystem = detectOperatingSystem(userAgent);

        // Get IP address
        const ipAddress =
            req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
            req.socket.remoteAddress ||
            "Unknown";

        // Check whether this device has logged in before
        const isNew = await isNewDevice(
            userId,
            device,
            browser,
            operatingSystem
        );

        // Create session
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

        // Record successful login
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

        // Attach detection result to returned document
        session.$locals.isNewDevice = isNew;

        return session;

    } catch (error) {

        console.error("Session creation error:", error);

        throw error;
    }
};