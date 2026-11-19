import React, { useEffect, useState } from "react";

import {
    useNavigate,
    useLocation
} from "react-router-dom";

import {
    LayoutDashboard,
    FolderOpen,
    Share2,
    Clock3,
    Star,
    Settings,
    Cloud,
    LogOut,
    HardDrive,
    X
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Sidebar({ activeItem, setActiveItem, isOpen, onClose }) {

    const navigate = useNavigate();
    const location = useLocation();

    const { user, setUser } = useAuth();

    const [storageUsed, setStorageUsed] = useState(0);

    const menuItems = [
        { title: "Dashboard", icon: LayoutDashboard, path: "/" },
        { title: "My Files", icon: FolderOpen, path: "/my-files" },
        { title: "Shared Files", icon: Share2, path: "/shared-files" },
        { title: "Recent", icon: Clock3, path: "/recent-files" },
        { title: "Favourites", icon: Star, path: null }
    ];

    const currentActiveItem =
        menuItems.find(item => item.path === location.pathname)?.title ||
        activeItem ||
        "";

    useEffect(() => {

        const fetchStorage = async () => {

            try {

                const response = await api.get("/files");

                const files = response.data.files || [];

                const totalSize = files.reduce(
                    (total, file) => total + (file.size || 0),
                    0
                );

                setStorageUsed(totalSize);

            } catch (error) {

                console.error("Unable to fetch storage:", error);

            }

        };

        fetchStorage();

        window.addEventListener(
            "cloudspace-files-updated",
            fetchStorage
        );

        return () => {

            window.removeEventListener(
                "cloudspace-files-updated",
                fetchStorage
            );

        };

    }, []);

    const formatSize = (bytes) => {

        if (bytes < 1024) return `${bytes} B`;

        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }

        if (bytes < 1024 * 1024 * 1024) {
            return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        }

        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;

    };

    const fullName = [
        user?.firstName,
        user?.middleName,
        user?.lastName
    ].filter(Boolean).join(" ") || user?.name || "User";

    const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(name => name[0].toUpperCase())
        .join("");

    const storageLimit =
        user?.storageLimit || 10 * 1024 * 1024 * 1024;

    const storagePercentage = Math.min(
        (storageUsed / storageLimit) * 100,
        100
    );

    const handleNavigation = (item) => {

        if (!item.path) return;

        setActiveItem?.(item.title);

        navigate(item.path);

        onClose?.();

    };

    const handleLogout = async () => {

        try {

            await api.post("/auth/logout");

            setUser(null);

            navigate("/login", { replace: true });

            onClose?.();

        } catch (error) {

            console.error("Logout failed:", error);

        }

    };

    return (

        <>

            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

                <div className="sidebar-header">

                    <div className="brand">

                        <div className="brand-icon">
                            <Cloud size={23} />
                        </div>

                        <span>CloudSpace</span>

                    </div>

                    <button
                        className="mobile-close"
                        onClick={onClose}
                        aria-label="Close navigation"
                    >
                        <X size={21} />
                    </button>

                </div>

                <div className="sidebar-content">

                    <p className="sidebar-label">WORKSPACE</p>

                    <nav className="sidebar-menu">

                        {menuItems.map((item) => {

                            const Icon = item.icon;

                            return (

                                <button
                                    key={item.title}
                                    className={`sidebar-link ${
                                        currentActiveItem === item.title
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() => handleNavigation(item)}
                                    disabled={!item.path}
                                >

                                    <Icon size={19} strokeWidth={1.8} />

                                    <span>{item.title}</span>

                                </button>

                            );

                        })}

                    </nav>

                    <div className="sidebar-bottom">

                        <div className="storage-card">

                            <div className="storage-heading">

                                <HardDrive size={17} />

                                <span>Storage</span>

                            </div>

                            <div className="storage-progress">

                                <div
                                    className="storage-used"
                                    style={{
                                        width: `${storagePercentage}%`
                                    }}
                                />

                            </div>

                            <p>
                                {formatSize(storageUsed)} of{" "}
                                {formatSize(storageLimit)} used
                            </p>

                            <button className="upgrade-btn">
                                Manage storage
                            </button>

                        </div>

                        <button
                            className={`sidebar-link settings-link ${
                                currentActiveItem === "Settings"
                                    ? "active"
                                    : ""
                            }`}
                            onClick={() => {
                                setActiveItem?.("Settings");
                                onClose?.();
                            }}
                        >

                            <Settings size={19} />

                            <span>Settings</span>

                        </button>

                        <button
                            className="sidebar-link"
                            onClick={handleLogout}
                        >

                            <LogOut size={19} />

                            <span>Sign out</span>

                        </button>

                    </div>

                </div>

                <div className="sidebar-footer">

                    <div className="user-avatar">
                        {initials || "U"}
                    </div>

                    <div className="user-info">

                        <h4>{fullName}</h4>

                        <p>Free Account</p>

                    </div>

                </div>

            </aside>

        </>

    );

}

export default Sidebar;