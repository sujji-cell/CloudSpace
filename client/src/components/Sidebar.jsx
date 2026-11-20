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
    X,
    Trash2
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

function Sidebar({ activeItem, setActiveItem, isOpen, onClose }) {

    const navigate = useNavigate();
    const location = useLocation();

    const { user, setUser } = useAuth();

    const [storageUsed, setStorageUsed] = useState(0);
    const [favoriteCount, setFavoriteCount] = useState(0);
    const [recycleBinCount, setRecycleBinCount] = useState(0);


    // SIDEBAR MENU ITEMS

    const menuItems = [
        { title: "Dashboard", icon: LayoutDashboard, path: "/" },
        { title: "My Files", icon: FolderOpen, path: "/my-files" },
        { title: "Shared Files", icon: Share2, path: "/shared-files" },
        { title: "Recent", icon: Clock3, path: "/recent-files" },
        { title: "Favourites", icon: Star, path: "/favorites" },
        { title: "Recycle Bin", icon: Trash2, path: "/recycle-bin" }
    ];

    const currentActiveItem =
        menuItems.find(item => item.path === location.pathname)?.title ||
        activeItem ||
        "";


    // FETCH STORAGE INFORMATION

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


    useEffect(() => {

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


    // FETCH FAVOURITE COUNT

    const fetchFavoriteCount = async () => {

        try {

            const response = await api.get("/favorites");

            setFavoriteCount(
                (response.data.favorites || []).length
            );

        } catch (error) {

            console.error(
                "Unable to fetch favourite count:",
                error
            );

        }

    };


    useEffect(() => {

        fetchFavoriteCount();

        window.addEventListener(
            "cloudspace-favorites-updated",
            fetchFavoriteCount
        );

        return () => {

            window.removeEventListener(
                "cloudspace-favorites-updated",
                fetchFavoriteCount
            );

        };

    }, []);


    // FETCH RECYCLE BIN COUNT

    const fetchRecycleBinCount = async () => {

        try {

            const response = await api.get("/recycle-bin");

            setRecycleBinCount(
                (response.data.files || []).length
            );

        } catch (error) {

            console.error(
                "Unable to fetch Recycle Bin count:",
                error
            );

        }

    };


    useEffect(() => {

        fetchRecycleBinCount();

        window.addEventListener(
            "cloudspace-recycle-bin-updated",
            fetchRecycleBinCount
        );

        return () => {

            window.removeEventListener(
                "cloudspace-recycle-bin-updated",
                fetchRecycleBinCount
            );

        };

    }, []);


    // FORMAT STORAGE SIZE

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


    // USER INFORMATION

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


    // NAVIGATION

    const handleNavigation = (item) => {

        if (!item.path) return;

        setActiveItem?.(item.title);

        navigate(item.path);

        onClose?.();

    };


    // LOGOUT

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


    // SIDEBAR UI

    return (

        <>

            {isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={onClose}
                />
            )}

            <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

                {/* SIDEBAR HEADER */}

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


                {/* SIDEBAR CONTENT */}

                <div className="sidebar-content">

                    <p className="sidebar-label">
                        WORKSPACE
                    </p>


                    {/* NAVIGATION MENU */}

                    <nav className="sidebar-menu">

                        {menuItems.map((item) => {

                            const Icon = item.icon;

                            return (

                                <button
                                    key={item.title}
                                    className={`sidebar-link ${currentActiveItem === item.title
                                        ? "active"
                                        : ""
                                        }`}
                                    onClick={() => handleNavigation(item)}
                                >

                                    <Icon
                                        size={19}
                                        strokeWidth={1.8}
                                    />

                                    <span>{item.title}</span>


                                    {/* FAVOURITE COUNT BADGE */}

                                    {item.title === "Favourites" &&
                                        favoriteCount > 0 && (

                                            <span className="favorite-count-badge">
                                                {favoriteCount}
                                            </span>

                                        )}


                                    {/* RECYCLE BIN COUNT BADGE */}

                                    {item.title === "Recycle Bin" &&
                                        recycleBinCount > 0 && (

                                            <span className="favorite-count-badge">
                                                {recycleBinCount}
                                            </span>

                                        )}

                                </button>

                            );

                        })}

                    </nav>


                    {/* BOTTOM SECTION */}

                    <div className="sidebar-bottom">


                        {/* STORAGE CARD */}

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


                        {/* SETTINGS */}

                        <button
                            className={`sidebar-link settings-link ${currentActiveItem === "Settings"
                                ? "active"
                                : ""
                                }`}
                            onClick={() => {
                                setActiveItem?.("Settings");
                                navigate("/settings");
                                onClose?.();
                            }}
                        >

                            <Settings size={19} />

                            <span>Settings</span>

                        </button>


                        {/* LOGOUT */}

                        <button
                            className="sidebar-link"
                            onClick={handleLogout}
                        >

                            <LogOut size={19} />

                            <span>Sign out</span>

                        </button>

                    </div>

                </div>


                {/* USER PROFILE */}

                <div
                    className="sidebar-footer"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                        navigate("/account");
                        onClose?.();
                    }}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            navigate("/account");
                            onClose?.();
                        }
                    }}
                    title="View Account"
                >

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