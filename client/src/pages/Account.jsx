import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

import {
    User,
    Mail,
    CalendarDays,
    ShieldCheck,
    HardDrive,
    Edit,
    Lock,
    LogOut,
    CheckCircle,
    Camera
} from "lucide-react";

import "./Account.css";

function Account() {

    const { user, setUser } = useAuth();

    const navigate = useNavigate();

    const [activeItem, setActiveItem] = useState("Account");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // --------------------------------
    // FORMAT STORAGE SIZE
    // --------------------------------

    const formatSize = (bytes = 0) => {

        if (bytes < 1024) {
            return `${bytes} B`;
        }

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(2)} KB`;
        }

        if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }

        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

    };


    // --------------------------------
    // FORMAT DATE
    // --------------------------------

    const formatDate = (date) => {

        if (!date) return "Not available";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    };


    // --------------------------------
    // USER INFORMATION
    // --------------------------------

    const fullName = [
        user?.firstName,
        user?.middleName,
        user?.lastName
    ].filter(Boolean).join(" ") || user?.name || "User";

    const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    const storageUsed = user?.storageUsed || 0;

    const storageLimit =
        user?.storageLimit || 10 * 1024 * 1024 * 1024;

    const storagePercentage = storageLimit > 0
        ? Math.min((storageUsed / storageLimit) * 100, 100)
        : 0;


    // --------------------------------
    // LOGOUT
    // --------------------------------

    const handleLogout = async () => {

        try {

            const api = (await import("../api/axios")).default;

            await api.post("/auth/logout");

            setUser(null);

            navigate("/login");

        } catch (error) {

            console.error("Logout failed:", error);

        }

    };


    // --------------------------------
    // ACCOUNT UI
    // --------------------------------

    return (

        <div className="app-layout">

            <Sidebar
                activeItem={activeItem}
                setActiveItem={setActiveItem}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
            />

            <main className="main-content">

                <Navbar
                    activeItem={activeItem}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <div className="account-content">

                    {/* PAGE HEADING */}

                    <section className="account-heading">

                        <div>
                            <p className="account-eyebrow">
                                PERSONAL WORKSPACE
                            </p>

                            <h1>My Account</h1>

                            <p>
                                Manage your personal information and account details.
                            </p>
                        </div>

                    </section>


                    {/* PROFILE CARD */}

                    <section className="account-profile-card">

                        <div className="account-profile-main">

                            <div className="account-avatar">
                                {initials || "U"}
                            </div>

                            <div className="account-profile-info">

                                <h2>{fullName}</h2>

                                <p>{user?.email}</p>

                                <div className="account-badges">

                                    <span className="free-badge">
                                        Free Plan
                                    </span>

                                    <span className="verified-badge">

                                        <CheckCircle size={14} />

                                        Verified Account

                                    </span>

                                </div>

                            </div>

                        </div>

                        <button
                            className="edit-profile-btn"
                            onClick={() => alert("Edit Profile functionality coming soon!")}
                        >

                            <Edit size={16} />

                            Edit Profile

                        </button>

                    </section>


                    {/* ACCOUNT INFORMATION */}

                    <section className="account-section">

                        <div className="account-section-heading">

                            <div>
                                <h2>Personal Information</h2>

                                <p>
                                    Your registered account information.
                                </p>
                            </div>

                        </div>


                        <div className="account-info-grid">

                            <div className="account-info-card">

                                <div className="account-info-icon">
                                    <User size={20} />
                                </div>

                                <div>
                                    <span>First Name</span>
                                    <h3>{user?.firstName || "Not available"}</h3>
                                </div>

                            </div>


                            <div className="account-info-card">

                                <div className="account-info-icon">
                                    <User size={20} />
                                </div>

                                <div>
                                    <span>Middle Name</span>
                                    <h3>{user?.middleName || "Not provided"}</h3>
                                </div>

                            </div>


                            <div className="account-info-card">

                                <div className="account-info-icon">
                                    <User size={20} />
                                </div>

                                <div>
                                    <span>Last Name</span>
                                    <h3>{user?.lastName || "Not provided"}</h3>
                                </div>

                            </div>


                            <div className="account-info-card">

                                <div className="account-info-icon">
                                    <Mail size={20} />
                                </div>

                                <div>
                                    <span>Email Address</span>
                                    <h3>{user?.email || "Not available"}</h3>
                                </div>

                            </div>


                            <div className="account-info-card">

                                <div className="account-info-icon">
                                    <CalendarDays size={20} />
                                </div>

                                <div>
                                    <span>Member Since</span>
                                    <h3>{formatDate(user?.createdAt)}</h3>
                                </div>

                            </div>


                            <div className="account-info-card">

                                <div className="account-info-icon">
                                    <ShieldCheck size={20} />
                                </div>

                                <div>
                                    <span>Account Status</span>
                                    <h3>Active</h3>
                                </div>

                            </div>

                        </div>

                    </section>


                    {/* STORAGE OVERVIEW */}

                    <section className="account-section">

                        <div className="account-section-heading">

                            <div>
                                <h2>Storage Overview</h2>

                                <p>
                                    Monitor your CloudSpace storage usage.
                                </p>
                            </div>

                        </div>


                        <div className="account-storage-card">

                            <div className="storage-card-top">

                                <div className="storage-card-icon">
                                    <HardDrive size={23} />
                                </div>

                                <div>
                                    <h3>Cloud Storage</h3>
                                    <p>Free Plan</p>
                                </div>

                            </div>


                            <div className="storage-numbers">

                                <h2>{formatSize(storageUsed)}</h2>

                                <span>
                                    of {formatSize(storageLimit)}
                                </span>

                            </div>


                            <div className="storage-progress-track">

                                <div
                                    className="storage-progress-fill"
                                    style={{
                                        width: `${storagePercentage}%`
                                    }}
                                />

                            </div>


                            <div className="storage-card-footer">

                                <span>
                                    {storagePercentage.toFixed(1)}% used
                                </span>

                                <span>
                                    {formatSize(
                                        Math.max(storageLimit - storageUsed, 0)
                                    )} available
                                </span>

                            </div>

                        </div>

                    </section>


                    {/* ACCOUNT SECURITY */}

                    <section className="account-section">

                        <div className="account-section-heading">

                            <div>
                                <h2>Account & Security</h2>

                                <p>
                                    Manage your account security.
                                </p>
                            </div>

                        </div>


                        <div className="account-action-list">

                            <div className="account-action-item">

                                <div className="account-action-left">

                                    <div className="account-action-icon">
                                        <Lock size={19} />
                                    </div>

                                    <div>
                                        <h3>Change Password</h3>

                                        <p>
                                            Update your account password.
                                        </p>
                                    </div>

                                </div>

                                <button
                                    onClick={() => alert("Change Password functionality coming soon!")}
                                >
                                    Manage
                                </button>

                            </div>


                            <div className="account-action-item">

                                <div className="account-action-left">

                                    <div className="account-action-icon">
                                        <LogOut size={19} />
                                    </div>

                                    <div>
                                        <h3>Sign Out</h3>

                                        <p>
                                            Sign out of your CloudSpace account.
                                        </p>
                                    </div>

                                </div>

                                <button
                                    className="logout-action-btn"
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>

                            </div>

                        </div>

                    </section>


                    {/* FOOTER */}

                    <footer className="account-footer">

                        CloudSpace © 2026 · Secure file storage and sharing

                    </footer>

                </div>

            </main>

        </div>

    );

}

export default Account;