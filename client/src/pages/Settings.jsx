import React, { useCallback, useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

import {
    Eye,
    EyeOff,
    ShieldCheck,
    Bell,
    Mail,
    Smartphone,
    Palette,
    Sun,
    Moon,
    Monitor,
    Layout,
    SlidersHorizontal,
    Laptop,
    Tablet,
    Globe,
    Clock,
    History,
    RefreshCw,
    LogOut,
    ShieldAlert,
    MonitorSmartphone,
    CheckCircle2,
    XCircle,
    MapPin
} from "lucide-react";

import "./Settings.css";


const defaultNotificationPreferences = {
    email: {
        fileSharing: true,
        fileUploads: true,
        securityAlerts: true
    },
    inApp: {
        sharedFileUpdates: true,
        storageAlerts: true,
        accountActivity: true
    }
};


const defaultAppearancePreferences = {
    theme: "light",
    accentColor: "blue",
    sidebar: "expanded",
    density: "comfortable"
};


const formatDate = (date) => {
    if (!date) return "Unknown";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return "Unknown";
    }

    return parsedDate.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
};


const getDeviceIcon = (device) => {
    const value = (device || "").toLowerCase();

    if (value.includes("tablet")) {
        return Tablet;
    }

    if (value.includes("mobile") || value.includes("phone")) {
        return Smartphone;
    }

    if (value.includes("desktop")) {
        return Monitor;
    }

    if (value.includes("laptop")) {
        return Laptop;
    }

    return MonitorSmartphone;
};


const getEventLabel = (event) => {
    const labels = {
        login: "Successful Login",
        logout: "Logout",
        session_revoked: "Session Revoked",
        login_failed: "Failed Login Attempt",
        suspicious_login_alert: "Suspicious Login Activity"
    };

    return labels[event] || "Account Activity";
};


function Settings() {

    const {
        user,
        setUser,
        setTheme,
        setAccentColor,
        setSidebar,
        setDensity
    } = useAuth();


    // ==========================================
    // PROFILE STATE
    // ==========================================

    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: ""
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");


    // ==========================================
    // PASSWORD STATE
    // ==========================================

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });


    // ==========================================
    // TWO-FACTOR AUTHENTICATION STATE
    // ==========================================

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [twoFactorPassword, setTwoFactorPassword] = useState("");
    const [updatingTwoFactor, setUpdatingTwoFactor] = useState(false);
    const [twoFactorMessage, setTwoFactorMessage] = useState("");
    const [twoFactorError, setTwoFactorError] = useState("");


    // ==========================================
    // NOTIFICATION STATE
    // ==========================================

    const [notificationPreferences, setNotificationPreferences] = useState(
        defaultNotificationPreferences
    );

    const [loadingNotifications, setLoadingNotifications] = useState(true);
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState("");
    const [notificationError, setNotificationError] = useState("");


    // ==========================================
    // APPEARANCE STATE
    // ==========================================

    const [appearancePreferences, setAppearancePreferences] = useState(
        defaultAppearancePreferences
    );

    const [loadingAppearance, setLoadingAppearance] = useState(true);
    const [savingAppearance, setSavingAppearance] = useState(false);
    const [appearanceMessage, setAppearanceMessage] = useState("");
    const [appearanceError, setAppearanceError] = useState("");


    // ==========================================
    // SESSION MANAGEMENT STATE
    // ==========================================

    const [activeSessions, setActiveSessions] = useState([]);
    const [loginHistory, setLoginHistory] = useState([]);

    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const [sessionError, setSessionError] = useState("");
    const [historyError, setHistoryError] = useState("");

    const [revokingSession, setRevokingSession] = useState("");
    const [revokingOthers, setRevokingOthers] = useState(false);

    const [sessionMessage, setSessionMessage] = useState("");


    // ==========================================
    // LOAD PROFILE INFORMATION
    // ==========================================

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                middleName: user.middleName || "",
                lastName: user.lastName || ""
            });
        }
    }, [user]);


    // ==========================================
    // SESSION API FUNCTIONS
    // ==========================================

    const fetchActiveSessions = useCallback(async () => {
        try {
            setLoadingSessions(true);
            setSessionError("");

            const response = await api.get("/sessions/active");

            setActiveSessions(response.data.sessions || []);

        } catch (err) {
            setSessionError(
                err.response?.data?.message ||
                "Unable to load active sessions."
            );
        } finally {
            setLoadingSessions(false);
        }
    }, []);


    const fetchLoginHistory = useCallback(async () => {
        try {
            setLoadingHistory(true);
            setHistoryError("");

            const response = await api.get("/sessions/history");

            setLoginHistory(response.data.activities || []);

        } catch (err) {
            setHistoryError(
                err.response?.data?.message ||
                "Unable to load login history."
            );
        } finally {
            setLoadingHistory(false);
        }
    }, []);


    useEffect(() => {
        fetchActiveSessions();
        fetchLoginHistory();
    }, [fetchActiveSessions, fetchLoginHistory]);


    // ==========================================
    // REVOKE INDIVIDUAL SESSION
    // ==========================================

    const handleRevokeSession = async (sessionId) => {

        const confirmed = window.confirm(
            "Are you sure you want to sign out this device?"
        );

        if (!confirmed) return;

        try {
            setRevokingSession(sessionId);
            setSessionMessage("");
            setSessionError("");

            const response = await api.delete(
                `/sessions/${encodeURIComponent(sessionId)}`
            );

            setSessionMessage(
                response.data.message || "Session revoked successfully."
            );

            await Promise.all([
                fetchActiveSessions(),
                fetchLoginHistory()
            ]);

        } catch (err) {
            setSessionError(
                err.response?.data?.message ||
                "Unable to revoke this session."
            );
        } finally {
            setRevokingSession("");
        }
    };


    // ==========================================
    // REVOKE ALL OTHER SESSIONS
    // ==========================================

    const handleRevokeOthers = async () => {

        const confirmed = window.confirm(
            "This will sign out all other devices except your current device. Continue?"
        );

        if (!confirmed) return;

        try {
            setRevokingOthers(true);
            setSessionMessage("");
            setSessionError("");

            const response = await api.delete(
                "/sessions/revoke-others"
            );

            setSessionMessage(
                response.data.message ||
                "Other sessions have been revoked successfully."
            );

            await Promise.all([
                fetchActiveSessions(),
                fetchLoginHistory()
            ]);

        } catch (err) {
            setSessionError(
                err.response?.data?.message ||
                "Unable to revoke other sessions."
            );
        } finally {
            setRevokingOthers(false);
        }
    };


    // ==========================================
    // LOAD TWO-FACTOR AUTHENTICATION STATUS
    // ==========================================

    useEffect(() => {

        const fetchTwoFactorStatus = async () => {
            try {
                const response = await api.get("/auth/me");

                setTwoFactorEnabled(
                    response.data.user.twoFactorEnabled || false
                );

            } catch (err) {
                console.error("Unable to load 2FA status:", err);
            }
        };

        fetchTwoFactorStatus();

    }, []);


    // ==========================================
    // LOAD NOTIFICATION PREFERENCES
    // ==========================================

    useEffect(() => {

        const fetchNotificationPreferences = async () => {
            try {
                setLoadingNotifications(true);

                const response = await api.get(
                    "/auth/notification-preferences"
                );

                const preferences = response.data.preferences;

                setNotificationPreferences({
                    email: {
                        ...defaultNotificationPreferences.email,
                        ...preferences?.email
                    },
                    inApp: {
                        ...defaultNotificationPreferences.inApp,
                        ...preferences?.inApp
                    }
                });

            } catch (err) {
                setNotificationError(
                    err.response?.data?.message ||
                    "Unable to load notification preferences."
                );
            } finally {
                setLoadingNotifications(false);
            }
        };

        fetchNotificationPreferences();

    }, []);


    // ==========================================
    // LOAD APPEARANCE PREFERENCES
    // ==========================================

    useEffect(() => {

        const fetchAppearancePreferences = async () => {
            try {
                setLoadingAppearance(true);

                const response = await api.get(
                    "/auth/appearance-preferences"
                );

                const preferences = response.data.preferences;

                setAppearancePreferences({
                    theme: preferences?.theme || "light",
                    accentColor: preferences?.accentColor || "blue",
                    sidebar: preferences?.sidebar || "expanded",
                    density: preferences?.density || "comfortable"
                });

            } catch (err) {
                setAppearanceError(
                    err.response?.data?.message ||
                    "Unable to load appearance preferences."
                );
            } finally {
                setLoadingAppearance(false);
            }
        };

        fetchAppearancePreferences();

    }, []);


    // ==========================================
    // PROFILE HANDLERS
    // ==========================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setMessage("");
        setError("");
    };


    const handleCancel = () => {
        setFormData({
            firstName: user?.firstName || "",
            middleName: user?.middleName || "",
            lastName: user?.lastName || ""
        });

        setMessage("");
        setError("");
    };


    const handleSave = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!formData.firstName.trim()) {
            setError("First name is required.");
            return;
        }

        try {
            setSaving(true);

            const response = await api.put(
                "/auth/update-profile",
                {
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName
                }
            );

            setUser(response.data.user);
            setMessage("Profile updated successfully.");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };


    // ==========================================
    // PASSWORD HANDLERS
    // ==========================================

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;

        setPasswordData((prev) => ({
            ...prev,
            [name]: value
        }));

        setPasswordMessage("");
        setPasswordError("");
    };


    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field]
        }));
    };


    const handleChangePassword = async (e) => {
        e.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = passwordData;

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordError("Please fill in all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError(
                "New password must contain at least 8 characters."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        if (currentPassword === newPassword) {
            setPasswordError(
                "New password must be different from your current password."
            );
            return;
        }

        try {
            setChangingPassword(true);

            const response = await api.put(
                "/auth/change-password",
                {
                    currentPassword,
                    newPassword
                }
            );

            setPasswordMessage(
                response.data.message || "Password changed successfully."
            );

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setShowPasswords({
                current: false,
                new: false,
                confirm: false
            });

        } catch (err) {
            setPasswordError(
                err.response?.data?.message ||
                "Unable to change password. Please try again."
            );
        } finally {
            setChangingPassword(false);
        }
    };


    // ==========================================
    // TWO-FACTOR AUTHENTICATION HANDLER
    // ==========================================

    const handleUpdateTwoFactor = async () => {

        setTwoFactorMessage("");
        setTwoFactorError("");

        if (!twoFactorPassword) {
            setTwoFactorError("Please enter your current password.");
            return;
        }

        try {
            setUpdatingTwoFactor(true);

            const newStatus = !twoFactorEnabled;

            const response = await api.put(
                "/auth/two-factor",
                {
                    enabled: newStatus,
                    currentPassword: twoFactorPassword
                }
            );

            setTwoFactorEnabled(response.data.twoFactorEnabled);

            setTwoFactorMessage(response.data.message);

            setTwoFactorPassword("");

            if (user) {
                setUser({
                    ...user,
                    twoFactorEnabled: response.data.twoFactorEnabled
                });
            }

        } catch (err) {
            setTwoFactorError(
                err.response?.data?.message ||
                "Unable to update two-factor authentication."
            );
        } finally {
            setUpdatingTwoFactor(false);
        }
    };


    // ==========================================
    // NOTIFICATION HANDLERS
    // ==========================================

    const handleNotificationToggle = (category, field) => {

        setNotificationPreferences((prev) => ({
            ...prev,
            [category]: {
                ...prev[category],
                [field]: !prev[category][field]
            }
        }));

        setNotificationMessage("");
        setNotificationError("");
    };


    const handleToggleAllNotifications = (enabled) => {

        setNotificationPreferences({
            email: {
                fileSharing: enabled,
                fileUploads: enabled,
                securityAlerts: enabled
            },
            inApp: {
                sharedFileUpdates: enabled,
                storageAlerts: enabled,
                accountActivity: enabled
            }
        });

        setNotificationMessage("");
        setNotificationError("");
    };


    const handleSaveNotifications = async () => {

        try {
            setSavingNotifications(true);

            setNotificationMessage("");
            setNotificationError("");

            const response = await api.put(
                "/auth/notification-preferences",
                notificationPreferences
            );

            const preferences = response.data.preferences;

            setNotificationPreferences({
                email: {
                    ...defaultNotificationPreferences.email,
                    ...preferences?.email
                },
                inApp: {
                    ...defaultNotificationPreferences.inApp,
                    ...preferences?.inApp
                }
            });

            setNotificationMessage(
                response.data.message ||
                "Notification preferences saved successfully."
            );

        } catch (err) {
            setNotificationError(
                err.response?.data?.message ||
                "Unable to save notification preferences."
            );
        } finally {
            setSavingNotifications(false);
        }
    };


    // ==========================================
    // APPEARANCE HANDLERS
    // ==========================================

    const handleAppearanceChange = (field, value) => {

        setAppearancePreferences((prev) => ({
            ...prev,
            [field]: value
        }));

        setAppearanceMessage("");
        setAppearanceError("");
    };


    const handleSaveAppearance = async () => {

        try {
            setSavingAppearance(true);

            setAppearanceMessage("");
            setAppearanceError("");

            const response = await api.put(
                "/auth/appearance-preferences",
                appearancePreferences
            );

            const savedPreferences = response.data.preferences;

            setAppearancePreferences(savedPreferences);

            setTheme(savedPreferences.theme);
            setAccentColor(savedPreferences.accentColor);
            setSidebar(savedPreferences.sidebar);
            setDensity(savedPreferences.density);

            setAppearanceMessage(
                response.data.message ||
                "Appearance preferences saved successfully."
            );

        } catch (err) {
            setAppearanceError(
                err.response?.data?.message ||
                "Unable to save appearance preferences."
            );
        } finally {
            setSavingAppearance(false);
        }
    };


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="app-layout">

            <Sidebar activeItem="Settings" />

            <main className="main-content">

                <Navbar activeItem="Settings" />

                <div className="settings-content">

                    <div className="settings-heading">
                        <h1>Settings</h1>
                        <p>
                            Manage your account preferences and application settings.
                        </p>
                    </div>


                    {/* ================================== */}
                    {/* PROFILE SETTINGS */}
                    {/* ================================== */}

                    <div className="settings-section">

                        <div className="settings-section-heading">
                            <div>
                                <h2>Profile Settings</h2>
                                <p>Update your personal information.</p>
                            </div>
                        </div>

                        <form onSubmit={handleSave}>

                            <div className="settings-form-grid">

                                <div className="settings-form-group">
                                    <label htmlFor="firstName">First Name</label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>

                                <div className="settings-form-group">
                                    <label htmlFor="middleName">Middle Name</label>
                                    <input
                                        type="text"
                                        id="middleName"
                                        name="middleName"
                                        value={formData.middleName}
                                        onChange={handleChange}
                                        placeholder="Enter middle name"
                                    />
                                </div>

                                <div className="settings-form-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder="Enter last name"
                                    />
                                </div>

                                <div className="settings-form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={user?.email || ""}
                                        disabled
                                    />
                                    <small>Email address cannot be changed here.</small>
                                </div>

                            </div>

                            {message && (
                                <div className="settings-success">{message}</div>
                            )}

                            {error && (
                                <div className="settings-error">{error}</div>
                            )}

                            <div className="settings-form-actions">

                                <button
                                    type="button"
                                    className="settings-cancel-btn"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="settings-save-btn"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                            </div>

                        </form>

                    </div>


                    {/* ================================== */}
                    {/* SECURITY SETTINGS */}
                    {/* ================================== */}

                    <div className="settings-section security-section">

                        <div className="settings-section-heading">

                            <div>
                                <h2>Security</h2>
                                <p>Manage your password and account security.</p>
                            </div>

                            <ShieldCheck size={23} color="#4169e1" />

                        </div>


                        {/* PASSWORD */}

                        <form onSubmit={handleChangePassword}>

                            <div className="settings-password-fields">

                                {[
                                    {
                                        id: "currentPassword",
                                        label: "Current Password",
                                        field: "currentPassword",
                                        visibility: "current",
                                        placeholder: "Enter current password",
                                        autoComplete: "current-password"
                                    },
                                    {
                                        id: "newPassword",
                                        label: "New Password",
                                        field: "newPassword",
                                        visibility: "new",
                                        placeholder: "Enter new password",
                                        autoComplete: "new-password"
                                    },
                                    {
                                        id: "confirmPassword",
                                        label: "Confirm New Password",
                                        field: "confirmPassword",
                                        visibility: "confirm",
                                        placeholder: "Confirm new password",
                                        autoComplete: "new-password"
                                    }
                                ].map((item) => (

                                    <div className="settings-form-group" key={item.field}>

                                        <label htmlFor={item.id}>
                                            {item.label}
                                        </label>

                                        <div className="password-input-wrapper">

                                            <input
                                                type={
                                                    showPasswords[item.visibility]
                                                        ? "text"
                                                        : "password"
                                                }
                                                id={item.id}
                                                name={item.field}
                                                value={passwordData[item.field]}
                                                onChange={handlePasswordChange}
                                                placeholder={item.placeholder}
                                                autoComplete={item.autoComplete}
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    togglePasswordVisibility(item.visibility)
                                                }
                                                aria-label={`Toggle ${item.label} visibility`}
                                            >
                                                {showPasswords[item.visibility]
                                                    ? <EyeOff size={17} />
                                                    : <Eye size={17} />
                                                }
                                            </button>

                                        </div>

                                        {item.field === "newPassword" && (
                                            <small>Use at least 8 characters.</small>
                                        )}

                                    </div>

                                ))}

                            </div>

                            {passwordMessage && (
                                <div className="settings-success">
                                    {passwordMessage}
                                </div>
                            )}

                            {passwordError && (
                                <div className="settings-error">
                                    {passwordError}
                                </div>
                            )}

                            <div className="settings-form-actions">

                                <button
                                    type="button"
                                    className="settings-cancel-btn"
                                    onClick={() => {
                                        setPasswordData({
                                            currentPassword: "",
                                            newPassword: "",
                                            confirmPassword: ""
                                        });

                                        setPasswordMessage("");
                                        setPasswordError("");
                                    }}
                                    disabled={changingPassword}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="settings-save-btn"
                                    disabled={changingPassword}
                                >
                                    {changingPassword
                                        ? "Updating..."
                                        : "Update Password"
                                    }
                                </button>

                            </div>

                        </form>


                        {/* TWO-FACTOR AUTHENTICATION */}

                        <div className="two-factor-settings">

                            <div className="two-factor-heading">

                                <div>
                                    <h3>Two-Factor Authentication</h3>
                                    <p>
                                        Add an extra layer of security to your account
                                        by requiring an email verification code during login.
                                    </p>
                                </div>

                                <ShieldCheck size={25} color="#4169e1" />

                            </div>


                            <div className="two-factor-status">
                                <span>Protection Status</span>

                                <span className={
                                    twoFactorEnabled
                                        ? "two-factor-enabled"
                                        : "two-factor-disabled"
                                }>
                                    {twoFactorEnabled ? "Enabled" : "Disabled"}
                                </span>
                            </div>


                            <div className="two-factor-description">
                                {twoFactorEnabled ? (
                                    <p>
                                        Your account is protected with two-factor
                                        authentication. A verification code will be
                                        required whenever you log in.
                                    </p>
                                ) : (
                                    <p>
                                        Two-factor authentication is currently disabled.
                                        Enable it to protect your CloudSpace account.
                                    </p>
                                )}
                            </div>


                            <div className="settings-form-group">

                                <label htmlFor="twoFactorPassword">
                                    Confirm Current Password
                                </label>

                                <div className="password-input-wrapper">
                                    <input
                                        type="password"
                                        id="twoFactorPassword"
                                        value={twoFactorPassword}
                                        onChange={(e) => {
                                            setTwoFactorPassword(e.target.value);
                                            setTwoFactorMessage("");
                                            setTwoFactorError("");
                                        }}
                                        placeholder="Enter your current password"
                                        autoComplete="current-password"
                                    />
                                </div>

                                <small>
                                    Your password is required to change this security setting.
                                </small>

                            </div>


                            {twoFactorMessage && (
                                <div className="settings-success">
                                    {twoFactorMessage}
                                </div>
                            )}

                            {twoFactorError && (
                                <div className="settings-error">
                                    {twoFactorError}
                                </div>
                            )}


                            <div className="settings-form-actions">

                                <button
                                    type="button"
                                    className="settings-save-btn"
                                    onClick={handleUpdateTwoFactor}
                                    disabled={updatingTwoFactor}
                                >
                                    {updatingTwoFactor
                                        ? "Updating..."
                                        : twoFactorEnabled
                                            ? "Disable Two-Factor Authentication"
                                            : "Enable Two-Factor Authentication"
                                    }
                                </button>

                            </div>

                        </div>


                        {/* ================================== */}
                        {/* ACTIVE SESSIONS */}
                        {/* ================================== */}

                        <div className="session-management-section">

                            <div className="session-section-heading">

                                <div>
                                    <h3>Active Sessions</h3>
                                    <p>
                                        Review devices currently signed in to your account.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="session-refresh-btn"
                                    onClick={fetchActiveSessions}
                                    disabled={loadingSessions}
                                    aria-label="Refresh active sessions"
                                >
                                    <RefreshCw
                                        size={17}
                                        className={loadingSessions ? "session-spinning" : ""}
                                    />
                                </button>

                            </div>


                            <div className="session-summary">

                                <div className="session-summary-icon">
                                    <MonitorSmartphone size={21} />
                                </div>

                                <div>
                                    <strong>{activeSessions.length}</strong>
                                    <span>
                                        Active {activeSessions.length === 1 ? "session" : "sessions"}
                                    </span>
                                </div>

                            </div>


                            {sessionMessage && (
                                <div className="settings-success">
                                    {sessionMessage}
                                </div>
                            )}

                            {sessionError && (
                                <div className="settings-error">
                                    {sessionError}
                                </div>
                            )}


                            {loadingSessions ? (

                                <p className="session-loading">
                                    Loading active sessions...
                                </p>

                            ) : activeSessions.length === 0 ? (

                                <div className="session-empty">
                                    <MonitorSmartphone size={30} />
                                    <p>No active sessions found.</p>
                                </div>

                            ) : (

                                <div className="active-session-list">

                                    {activeSessions.map((session) => {

                                        const DeviceIcon = getDeviceIcon(session.device);

                                        return (

                                            <div
                                                className="active-session-card"
                                                key={session.sessionId}
                                            >

                                                <div className="active-session-icon">
                                                    <DeviceIcon size={23} />
                                                </div>


                                                <div className="active-session-details">

                                                    <div className="active-session-title">

                                                        <h4>
                                                            {session.device || "Unknown Device"}
                                                        </h4>

                                                        {session.isCurrent && (
                                                            <span className="current-device-badge">
                                                                <CheckCircle2 size={13} />
                                                                Current Device
                                                            </span>
                                                        )}

                                                    </div>


                                                    <p>
                                                        {session.browser || "Unknown Browser"}
                                                        {" · "}
                                                        {session.operatingSystem || "Unknown OS"}
                                                    </p>


                                                    <div className="active-session-meta">

                                                        <span>
                                                            <Globe size={14} />
                                                            {session.ipAddress || "Unknown IP"}
                                                        </span>

                                                        <span>
                                                            <Clock size={14} />
                                                            Last active: {formatDate(session.lastActiveAt)}
                                                        </span>

                                                    </div>

                                                </div>


                                                {!session.isCurrent && (

                                                    <button
                                                        type="button"
                                                        className="revoke-session-btn"
                                                        onClick={() =>
                                                            handleRevokeSession(session.sessionId)
                                                        }
                                                        disabled={
                                                            revokingSession === session.sessionId ||
                                                            revokingOthers
                                                        }
                                                    >

                                                        <LogOut size={15} />

                                                        {revokingSession === session.sessionId
                                                            ? "Revoking..."
                                                            : "Revoke"
                                                        }

                                                    </button>

                                                )}

                                            </div>

                                        );

                                    })}

                                </div>

                            )}


                            {activeSessions.some((session) => !session.isCurrent) && (

                                <div className="revoke-others-container">

                                    <div>
                                        <h4>Sign out other devices</h4>
                                        <p>
                                            End all other active sessions while keeping
                                            this device signed in.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        className="revoke-others-btn"
                                        onClick={handleRevokeOthers}
                                        disabled={revokingOthers || !!revokingSession}
                                    >
                                        <ShieldAlert size={16} />

                                        {revokingOthers
                                            ? "Revoking..."
                                            : "Revoke All Other Sessions"
                                        }
                                    </button>

                                </div>

                            )}

                        </div>


                        {/* ================================== */}
                        {/* LOGIN HISTORY */}
                        {/* ================================== */}

                        <div className="login-history-section">

                            <div className="session-section-heading">

                                <div>
                                    <h3>Login History</h3>
                                    <p>
                                        Review recent login and security activity.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="session-refresh-btn"
                                    onClick={fetchLoginHistory}
                                    disabled={loadingHistory}
                                    aria-label="Refresh login history"
                                >
                                    <RefreshCw
                                        size={17}
                                        className={loadingHistory ? "session-spinning" : ""}
                                    />
                                </button>

                            </div>


                            {historyError && (
                                <div className="settings-error">
                                    {historyError}
                                </div>
                            )}


                            {loadingHistory ? (

                                <p className="session-loading">
                                    Loading login history...
                                </p>

                            ) : loginHistory.length === 0 ? (

                                <div className="session-empty">
                                    <History size={30} />
                                    <p>No login activity found.</p>
                                </div>

                            ) : (

                                <div className="login-history-list">

                                    {loginHistory.map((activity) => (

                                        <div
                                            className="login-history-item"
                                            key={activity._id}
                                        >

                                            <div className={`login-history-icon ${activity.event || ""}`}>

                                                {activity.event === "login" ? (
                                                    <CheckCircle2 size={19} />
                                                ) : activity.event === "login_failed" ? (
                                                    <XCircle size={19} />
                                                ) : activity.event === "suspicious_login_alert" ? (
                                                    <ShieldAlert size={19} />
                                                ) : activity.event === "session_revoked" ? (
                                                    <ShieldAlert size={19} />
                                                ) : (
                                                    <History size={19} />
                                                )}

                                            </div>


                                            <div className="login-history-details">

                                                <h4>
                                                    {getEventLabel(activity.event)}
                                                </h4>

                                                <p>
                                                    {activity.details ||
                                                        `${activity.device || "Unknown device"} · ${activity.browser || "Unknown browser"}`
                                                    }
                                                </p>

                                                <div className="login-history-meta">

                                                    {activity.device &&
                                                        activity.device !== "Unknown" && (
                                                            <span>
                                                                {activity.device}
                                                            </span>
                                                        )
                                                    }

                                                    {activity.browser &&
                                                        activity.browser !== "Unknown" && (
                                                            <span>
                                                                {activity.browser}
                                                            </span>
                                                        )
                                                    }

                                                    <span>
                                                        <Globe size={13} />
                                                        {activity.ipAddress || "Unknown IP"}
                                                    </span>

                                                </div>

                                            </div>


                                            <div className="login-history-date">
                                                <Clock size={14} />
                                                <span>{formatDate(activity.createdAt)}</span>
                                            </div>

                                        </div>

                                    ))}

                                </div>

                            )}

                        </div>

                    </div>


                    {/* ================================== */}
                    {/* NOTIFICATION SETTINGS */}
                    {/* ================================== */}

                    <div className="settings-section security-section notification-section">

                        <div className="settings-section-heading">

                            <div>
                                <h2>Notification Preferences</h2>
                                <p>Choose which notifications you want to receive.</p>
                            </div>

                            <Bell size={23} color="#4169e1" />

                        </div>


                        {loadingNotifications ? (

                            <p className="notification-loading">
                                Loading notification preferences...
                            </p>

                        ) : (

                            <>

                                <div className="notification-global-actions">

                                    <span>Manage all notifications</span>

                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleAllNotifications(true)}
                                        >
                                            Enable All
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleAllNotifications(false)}
                                        >
                                            Disable All
                                        </button>
                                    </div>

                                </div>


                                <div className="notification-category">

                                    <div className="notification-category-heading">

                                        <Mail size={19} />

                                        <div>
                                            <h3>Email Notifications</h3>
                                            <p>Receive important updates through email.</p>
                                        </div>

                                    </div>


                                    {[
                                        {
                                            field: "fileSharing",
                                            title: "File Sharing",
                                            description: "Get notified when files are shared with you."
                                        },
                                        {
                                            field: "fileUploads",
                                            title: "File Uploads",
                                            description: "Receive notifications about file upload activity."
                                        },
                                        {
                                            field: "securityAlerts",
                                            title: "Security Alerts",
                                            description: "Receive important account security notifications."
                                        }
                                    ].map((item) => (

                                        <div className="notification-option" key={item.field}>

                                            <div>
                                                <h4>{item.title}</h4>
                                                <p>{item.description}</p>
                                            </div>

                                            <label className="notification-switch">

                                                <input
                                                    type="checkbox"
                                                    checked={notificationPreferences.email[item.field]}
                                                    onChange={() =>
                                                        handleNotificationToggle("email", item.field)
                                                    }
                                                />

                                                <span className="notification-slider"></span>

                                            </label>

                                        </div>

                                    ))}

                                </div>


                                <div className="notification-category">

                                    <div className="notification-category-heading">

                                        <Smartphone size={19} />

                                        <div>
                                            <h3>In-App Notifications</h3>
                                            <p>Manage notifications displayed inside CloudSpace.</p>
                                        </div>

                                    </div>


                                    {[
                                        {
                                            field: "sharedFileUpdates",
                                            title: "Shared File Updates",
                                            description: "Get updates when shared files are modified."
                                        },
                                        {
                                            field: "storageAlerts",
                                            title: "Storage Alerts",
                                            description: "Receive alerts when your storage is running low."
                                        },
                                        {
                                            field: "accountActivity",
                                            title: "Account Activity",
                                            description: "Get updates about activity on your account."
                                        }
                                    ].map((item) => (

                                        <div className="notification-option" key={item.field}>

                                            <div>
                                                <h4>{item.title}</h4>
                                                <p>{item.description}</p>
                                            </div>

                                            <label className="notification-switch">

                                                <input
                                                    type="checkbox"
                                                    checked={notificationPreferences.inApp[item.field]}
                                                    onChange={() =>
                                                        handleNotificationToggle("inApp", item.field)
                                                    }
                                                />

                                                <span className="notification-slider"></span>

                                            </label>

                                        </div>

                                    ))}

                                </div>


                                {notificationMessage && (
                                    <div className="settings-success">
                                        {notificationMessage}
                                    </div>
                                )}

                                {notificationError && (
                                    <div className="settings-error">
                                        {notificationError}
                                    </div>
                                )}


                                <div className="settings-form-actions">

                                    <button
                                        type="button"
                                        className="settings-save-btn"
                                        onClick={handleSaveNotifications}
                                        disabled={savingNotifications}
                                    >
                                        {savingNotifications
                                            ? "Saving..."
                                            : "Save Preferences"
                                        }
                                    </button>

                                </div>

                            </>

                        )}

                    </div>


                    {/* ================================== */}
                    {/* APPEARANCE SETTINGS */}
                    {/* ================================== */}

                    <div className="settings-section security-section appearance-section">

                        <div className="settings-section-heading">

                            <div>
                                <h2>Appearance</h2>
                                <p>Customize how CloudSpace looks and feels.</p>
                            </div>

                            <Palette size={23} color="#4169e1" />

                        </div>


                        {loadingAppearance ? (

                            <p className="notification-loading">
                                Loading appearance preferences...
                            </p>

                        ) : (

                            <>

                                {/* THEME */}

                                <div className="appearance-setting-group">

                                    <div className="appearance-setting-heading">
                                        <div>
                                            <h3>Theme</h3>
                                            <p>Choose your preferred application theme.</p>
                                        </div>
                                    </div>


                                    <div className="appearance-choice-grid">

                                        {[
                                            {
                                                value: "light",
                                                label: "Light",
                                                description: "Bright appearance",
                                                Icon: Sun
                                            },
                                            {
                                                value: "dark",
                                                label: "Dark",
                                                description: "Dark appearance",
                                                Icon: Moon
                                            },
                                            {
                                                value: "system",
                                                label: "System",
                                                description: "Follow device settings",
                                                Icon: Monitor
                                            }
                                        ].map((item) => (

                                            <button
                                                key={item.value}
                                                type="button"
                                                className={`appearance-choice-card ${appearancePreferences.theme === item.value
                                                    ? "active"
                                                    : ""
                                                    }`}
                                                onClick={() =>
                                                    handleAppearanceChange("theme", item.value)
                                                }
                                            >

                                                <item.Icon size={22} />

                                                <span>{item.label}</span>

                                                <small>{item.description}</small>

                                            </button>

                                        ))}

                                    </div>

                                </div>


                                {/* ACCENT COLOR */}

                                <div className="appearance-setting-group">

                                    <div className="appearance-setting-heading">
                                        <div>
                                            <h3>Accent Color</h3>
                                            <p>Choose your preferred interface color.</p>
                                        </div>
                                    </div>


                                    <div className="appearance-color-options">

                                        {[
                                            { name: "blue", color: "#4169e1" },
                                            { name: "purple", color: "#8b5cf6" },
                                            { name: "green", color: "#16a36a" },
                                            { name: "orange", color: "#f28c28" }
                                        ].map((item) => (

                                            <button
                                                key={item.name}
                                                type="button"
                                                className={`appearance-color-option ${appearancePreferences.accentColor === item.name
                                                    ? "active"
                                                    : ""
                                                    }`}
                                                onClick={() =>
                                                    handleAppearanceChange("accentColor", item.name)
                                                }
                                                aria-label={`${item.name} accent color`}
                                                title={item.name}
                                            >

                                                <span
                                                    style={{
                                                        backgroundColor: item.color
                                                    }}
                                                />

                                                <small>
                                                    {item.name.charAt(0).toUpperCase() +
                                                        item.name.slice(1)}
                                                </small>

                                            </button>

                                        ))}

                                    </div>

                                </div>


                                {/* SIDEBAR */}

                                <div className="appearance-setting-group">

                                    <div className="appearance-setting-heading">

                                        <div>
                                            <h3>Sidebar Layout</h3>
                                            <p>Choose how the navigation sidebar appears.</p>
                                        </div>

                                        <Layout size={20} color="#9295a0" />

                                    </div>


                                    <div className="appearance-radio-options">

                                        <label>
                                            <input
                                                type="radio"
                                                name="sidebar"
                                                checked={appearancePreferences.sidebar === "expanded"}
                                                onChange={() =>
                                                    handleAppearanceChange("sidebar", "expanded")
                                                }
                                            />
                                            <span>Expanded</span>
                                        </label>

                                        <label>
                                            <input
                                                type="radio"
                                                name="sidebar"
                                                checked={appearancePreferences.sidebar === "collapsed"}
                                                onChange={() =>
                                                    handleAppearanceChange("sidebar", "collapsed")
                                                }
                                            />
                                            <span>Collapsed</span>
                                        </label>

                                    </div>

                                </div>


                                {/* DENSITY */}

                                <div className="appearance-setting-group">

                                    <div className="appearance-setting-heading">

                                        <div>
                                            <h3>Layout Density</h3>
                                            <p>Adjust the spacing of interface elements.</p>
                                        </div>

                                        <SlidersHorizontal size={20} color="#9295a0" />

                                    </div>


                                    <div className="appearance-radio-options">

                                        <label>
                                            <input
                                                type="radio"
                                                name="density"
                                                checked={appearancePreferences.density === "comfortable"}
                                                onChange={() =>
                                                    handleAppearanceChange("density", "comfortable")
                                                }
                                            />
                                            <span>Comfortable</span>
                                        </label>

                                        <label>
                                            <input
                                                type="radio"
                                                name="density"
                                                checked={appearancePreferences.density === "compact"}
                                                onChange={() =>
                                                    handleAppearanceChange("density", "compact")
                                                }
                                            />
                                            <span>Compact</span>
                                        </label>

                                    </div>

                                </div>


                                {appearanceMessage && (
                                    <div className="settings-success">
                                        {appearanceMessage}
                                    </div>
                                )}

                                {appearanceError && (
                                    <div className="settings-error">
                                        {appearanceError}
                                    </div>
                                )}


                                <div className="settings-form-actions">

                                    <button
                                        type="button"
                                        className="settings-save-btn"
                                        onClick={handleSaveAppearance}
                                        disabled={savingAppearance}
                                    >
                                        {savingAppearance
                                            ? "Saving..."
                                            : "Save Appearance"
                                        }
                                    </button>

                                </div>

                            </>

                        )}

                    </div>

                </div>

            </main>

        </div>

    );

}

export default Settings;