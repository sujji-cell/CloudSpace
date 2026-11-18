import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

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

    const { user, setUser } = useAuth();

    const [storageUsed, setStorageUsed] = useState(0);


    const menuItems = [
        { title: "Dashboard", icon: LayoutDashboard },
        { title: "My Files", icon: FolderOpen },
        { title: "Shared Files", icon: Share2 },
        { title: "Recent", icon: Clock3 },
        { title: "Favourites", icon: Star }
    ];


    // --------------------------------
    // FETCH STORAGE
    // --------------------------------

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


        // Initial storage fetch
        fetchStorage();


        // Listen for file upload/delete events
        window.addEventListener(
            "cloudspace-files-updated",
            fetchStorage
        );


        // Cleanup event listener
        return () => {

            window.removeEventListener(
                "cloudspace-files-updated",
                fetchStorage
            );

        };

    }, []);


    // --------------------------------
    // FORMAT STORAGE
    // --------------------------------

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


    // --------------------------------
    // USER INFORMATION
    // --------------------------------

    const firstName =
        user?.firstName ||
        user?.name?.trim().split(/\s+/)[0] ||
        "User";

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


    // --------------------------------
    // STORAGE LIMIT
    // --------------------------------

    const storageLimit =
        user?.storageLimit || 10 * 1024 * 1024 * 1024;

    const storagePercentage = Math.min(
        (storageUsed / storageLimit) * 100,
        100
    );


    // --------------------------------
    // NAVIGATION
    // --------------------------------

    const handleNavigation = (title) => {

        setActiveItem(title);

        const routes = {
            "Dashboard": "/",
            "My Files": "/my-files"
        };

        if (routes[title]) {
            navigate(routes[title]);
        }

        onClose();

    };


    // --------------------------------
    // LOGOUT
    // --------------------------------

    const handleLogout = async () => {

        try {

            await api.post("/auth/logout");

            setUser(null);

            navigate("/login", { replace: true });

        } catch (error) {

            console.error("Logout failed:", error);

        }

    };


    // --------------------------------
    // SIDEBAR UI
    // --------------------------------

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


                    {/* NAVIGATION */}

                    <nav className="sidebar-menu">

                        {menuItems.map((item) => {

                            const Icon = item.icon;

                            return (

                                <button
                                    key={item.title}
                                    className={`sidebar-link ${
                                        activeItem === item.title ? "active" : ""
                                    }`}
                                    onClick={() => handleNavigation(item.title)}
                                >

                                    <Icon size={19} strokeWidth={1.8} />

                                    <span>{item.title}</span>

                                </button>

                            );

                        })}

                    </nav>


                    {/* SIDEBAR BOTTOM */}

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
                            className={`sidebar-link settings-link ${
                                activeItem === "Settings" ? "active" : ""
                            }`}
                            onClick={() => {
                                setActiveItem("Settings");
                                onClose();
                            }}
                        >

                            <Settings size={19} />

                            <span>Settings</span>

                        </button>


                        {/* SIGN OUT */}

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