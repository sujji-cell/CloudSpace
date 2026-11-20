import React, { useEffect, useState } from "react";

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
    SlidersHorizontal
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


function Settings() {

    const { user, setUser, setTheme } = useAuth();


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

            setPasswordError("New password must contain at least 8 characters.");
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

            setNotificationPreferences(response.data.preferences);

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

            // Apply the selected theme globally
            setTheme(savedPreferences.theme);

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


                    {/* PROFILE SETTINGS */}

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
                                <div className="settings-success">
                                    {message}
                                </div>
                            )}

                            {error && (
                                <div className="settings-error">
                                    {error}
                                </div>
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


                    {/* SECURITY SETTINGS */}

                    <div className="settings-section security-section">

                        <div className="settings-section-heading">

                            <div>
                                <h2>Security</h2>
                                <p>Manage your password and account security.</p>
                            </div>

                            <ShieldCheck size={23} color="#4169e1" />

                        </div>

                        <form onSubmit={handleChangePassword}>

                            <div className="settings-password-fields">

                                <div className="settings-form-group">

                                    <label htmlFor="currentPassword">
                                        Current Password
                                    </label>

                                    <div className="password-input-wrapper">

                                        <input
                                            type={showPasswords.current ? "text" : "password"}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={passwordData.currentPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Enter current password"
                                            autoComplete="current-password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility("current")}
                                            aria-label="Toggle current password visibility"
                                        >
                                            {showPasswords.current
                                                ? <EyeOff size={17} />
                                                : <Eye size={17} />
                                            }
                                        </button>

                                    </div>

                                </div>


                                <div className="settings-form-group">

                                    <label htmlFor="newPassword">
                                        New Password
                                    </label>

                                    <div className="password-input-wrapper">

                                        <input
                                            type={showPasswords.new ? "text" : "password"}
                                            id="newPassword"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Enter new password"
                                            autoComplete="new-password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility("new")}
                                            aria-label="Toggle new password visibility"
                                        >
                                            {showPasswords.new
                                                ? <EyeOff size={17} />
                                                : <Eye size={17} />
                                            }
                                        </button>

                                    </div>

                                    <small>Use at least 8 characters.</small>

                                </div>


                                <div className="settings-form-group">

                                    <label htmlFor="confirmPassword">
                                        Confirm New Password
                                    </label>

                                    <div className="password-input-wrapper">

                                        <input
                                            type={showPasswords.confirm ? "text" : "password"}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            placeholder="Confirm new password"
                                            autoComplete="new-password"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => togglePasswordVisibility("confirm")}
                                            aria-label="Toggle confirm password visibility"
                                        >
                                            {showPasswords.confirm
                                                ? <EyeOff size={17} />
                                                : <Eye size={17} />
                                            }
                                        </button>

                                    </div>

                                </div>

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

                    </div>


                    {/* NOTIFICATION SETTINGS */}

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
                                                    onChange={() => handleNotificationToggle("email", item.field)}
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
                                                    onChange={() => handleNotificationToggle("inApp", item.field)}
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


                    {/* APPEARANCE SETTINGS */}

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

                                        <button
                                            type="button"
                                            className={`appearance-choice-card ${appearancePreferences.theme === "light" ? "active" : ""}`}
                                            onClick={() => handleAppearanceChange("theme", "light")}
                                        >

                                            <Sun size={22} />

                                            <span>Light</span>

                                            <small>Bright appearance</small>

                                        </button>


                                        <button
                                            type="button"
                                            className={`appearance-choice-card ${appearancePreferences.theme === "dark" ? "active" : ""}`}
                                            onClick={() => handleAppearanceChange("theme", "dark")}
                                        >

                                            <Moon size={22} />

                                            <span>Dark</span>

                                            <small>Dark appearance</small>

                                        </button>


                                        <button
                                            type="button"
                                            className={`appearance-choice-card ${appearancePreferences.theme === "system" ? "active" : ""}`}
                                            onClick={() => handleAppearanceChange("theme", "system")}
                                        >

                                            <Monitor size={22} />

                                            <span>System</span>

                                            <small>Follow device settings</small>

                                        </button>

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
                                                className={`appearance-color-option ${appearancePreferences.accentColor === item.name ? "active" : ""}`}
                                                onClick={() => handleAppearanceChange("accentColor", item.name)}
                                                aria-label={`${item.name} accent color`}
                                                title={item.name}
                                            >

                                                <span
                                                    style={{
                                                        backgroundColor: item.color
                                                    }}
                                                />

                                                <small>
                                                    {item.name.charAt(0).toUpperCase() + item.name.slice(1)}
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
                                                onChange={() => handleAppearanceChange("sidebar", "expanded")}
                                            />

                                            <span>Expanded</span>

                                        </label>


                                        <label>

                                            <input
                                                type="radio"
                                                name="sidebar"
                                                checked={appearancePreferences.sidebar === "collapsed"}
                                                onChange={() => handleAppearanceChange("sidebar", "collapsed")}
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
                                                onChange={() => handleAppearanceChange("density", "comfortable")}
                                            />

                                            <span>Comfortable</span>

                                        </label>


                                        <label>

                                            <input
                                                type="radio"
                                                name="density"
                                                checked={appearancePreferences.density === "compact"}
                                                onChange={() => handleAppearanceChange("density", "compact")}
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