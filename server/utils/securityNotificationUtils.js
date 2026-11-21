import Notification from "../models/Notification.js";
import sendEmail from "./sendEmail.js";

// ============================================
// HELPER: ESCAPE HTML CONTENT
// ============================================

const escapeHtml = (value = "") => {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
};

// ============================================
// CREATE NEW DEVICE SECURITY ALERTS
// ============================================

export const createSecurityNotification = async (user, session) => {
    try {
        // Only process new device profiles
        if (!session.$locals.isNewDevice) {
            return null;
        }

        const preferences = user.notificationPreferences;

        // ======================================
        // 1. IN-APP SECURITY NOTIFICATION
        // ======================================

        const inAppEnabled =
            preferences?.inApp?.accountActivity !== false;

        if (inAppEnabled) {
            try {
                await Notification.create({
                    recipient: user._id,
                    sender: null,
                    type: "security_alert",
                    title: "New Device Login Detected",

                    message: `A new login to your CloudSpace account was detected from ${session.device} using ${session.browser} on ${session.operatingSystem}. IP Address: ${session.ipAddress}.`,

                    link: "/settings"
                });

                console.log("In-app security notification created.");

            } catch (error) {
                console.error(
                    "In-app security notification error:",
                    error
                );
            }
        }

        // ======================================
        // 2. EMAIL SECURITY ALERT
        // ======================================

        const emailEnabled =
            preferences?.email?.securityAlerts !== false;

        if (emailEnabled) {
            try {
                const loginTime = new Date().toLocaleString(
                    "en-IN",
                    {
                        dateStyle: "medium",
                        timeStyle: "medium",
                        timeZone: "Asia/Kolkata"
                    }
                );

                const firstName = escapeHtml(
                    user.firstName || "User"
                );

                const device = escapeHtml(session.device);
                const browser = escapeHtml(session.browser);
                const operatingSystem = escapeHtml(
                    session.operatingSystem
                );
                const ipAddress = escapeHtml(session.ipAddress);

                const html = `
                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: auto;
                        padding: 25px;
                        color: #333;
                        background: #f8fafc;
                    ">

                        <div style="
                            background: #ffffff;
                            padding: 30px;
                            border-radius: 12px;
                        ">

                            <h2 style="color: #2563eb;">
                                CloudSpace Security Alert
                            </h2>

                            <p>Hello ${firstName},</p>

                            <p>
                                We detected a successful login to your
                                CloudSpace account from a new device.
                            </p>

                            <h3>Login Details</h3>

                            <table style="
                                width: 100%;
                                border-collapse: collapse;
                            ">
                                <tr>
                                    <td style="padding: 10px;">
                                        <strong>Device</strong>
                                    </td>
                                    <td style="padding: 10px;">
                                        ${device}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 10px;">
                                        <strong>Browser</strong>
                                    </td>
                                    <td style="padding: 10px;">
                                        ${browser}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 10px;">
                                        <strong>Operating System</strong>
                                    </td>
                                    <td style="padding: 10px;">
                                        ${operatingSystem}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 10px;">
                                        <strong>IP Address</strong>
                                    </td>
                                    <td style="padding: 10px;">
                                        ${ipAddress}
                                    </td>
                                </tr>

                                <tr>
                                    <td style="padding: 10px;">
                                        <strong>Login Time</strong>
                                    </td>
                                    <td style="padding: 10px;">
                                        ${loginTime}
                                    </td>
                                </tr>
                            </table>

                            <div style="
                                margin-top: 25px;
                                padding: 15px;
                                background: #fff7ed;
                                border-left: 4px solid #f97316;
                                border-radius: 5px;
                            ">
                                <strong>Wasn't this you?</strong>

                                <p>
                                    If you don't recognize this login,
                                    secure your account immediately.
                                    Change your password and review
                                    your active sessions.
                                </p>
                            </div>

                            <p style="margin-top: 25px;">
                                Stay safe,<br />
                                <strong>Team CloudSpace</strong>
                            </p>

                        </div>

                        <p style="
                            text-align: center;
                            color: #888;
                            font-size: 12px;
                        ">
                            This is an automated security notification.
                        </p>

                    </div>
                `;

                await sendEmail(
                    user.email,
                    "New Device Login Alert - CloudSpace",
                    html
                );

                console.log("Security alert email sent.");

            } catch (error) {
                console.error(
                    "Security alert email error:",
                    error
                );
            }
        }

        return true;

    } catch (error) {
        console.error(
            "Security notification error:",
            error
        );

        // Never interrupt a successful login
        return null;
    }
};