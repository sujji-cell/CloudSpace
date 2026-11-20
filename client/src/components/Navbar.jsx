import React from "react";
import { useNavigate } from "react-router-dom";

import {
    Search,
    Bell,
    Menu,
    ChevronDown
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

function Navbar({ activeItem, onMenuClick }) {

    const navigate = useNavigate();

    const { user } = useAuth();

    // Get user's full name
    const fullName = [
        user?.firstName,
        user?.middleName,
        user?.lastName
    ].filter(Boolean).join(" ") || user?.name || "User";

    // Generate profile initials
    const initials = fullName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    // Navigate to Account page
    const handleProfileClick = () => {
        navigate("/account");
    };

    return (

        <header className="navbar">

            <div className="navbar-left">

                <button
                    className="menu-toggle"
                    onClick={onMenuClick}
                    aria-label="Open navigation"
                >
                    <Menu size={23} />
                </button>

                <div className="page-heading">
                    <h2>{activeItem}</h2>
                    <p>Manage your files and documents</p>
                </div>

            </div>


            <div className="navbar-right">

                <div className="search-box">

                    <Search size={18} />

                    <input
                        type="text"
                        placeholder="Search your files..."
                        aria-label="Search files"
                    />

                    <span className="search-shortcut">⌘ K</span>

                </div>


                <button
                    className="notification-btn"
                    aria-label="Notifications"
                >
                    <Bell size={20} />
                    <span className="notification-dot"></span>
                </button>


                {/* USER PROFILE */}

                <div
                    className="navbar-profile"
                    role="button"
                    tabIndex={0}
                    onClick={handleProfileClick}
                    onKeyDown={(event) => {
                        if (
                            event.key === "Enter" ||
                            event.key === " "
                        ) {
                            event.preventDefault();
                            handleProfileClick();
                        }
                    }}
                    title="View Account"
                >

                    <div className="profile-avatar">
                        {initials || "U"}
                    </div>

                    <div className="profile-details">

                        <h4>{fullName}</h4>

                        <p>Free Plan</p>

                    </div>

                    <ChevronDown size={16} />

                </div>

            </div>

        </header>

    );

}

export default Navbar;