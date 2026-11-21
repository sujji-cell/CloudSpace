import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Search,
    Bell,
    Menu,
    ChevronDown,
    CheckCheck,
    Trash2,
    X,
    BellRing
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function Navbar({ activeItem, onMenuClick }) {

    const navigate = useNavigate();

    const { user } = useAuth();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    const notificationRef = useRef(null);

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


    // Fetch notifications
    const fetchNotifications = async () => {

        try {

            setLoadingNotifications(true);

            const response = await api.get("/notifications");

            setNotifications(response.data.notifications || []);
            setUnreadCount(response.data.unreadCount || 0);

        } catch (error) {

            console.error(
                "Fetch Notifications Error:",
                error
            );

        } finally {

            setLoadingNotifications(false);

        }

    };


    // Fetch notifications when Navbar loads
    useEffect(() => {

        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);

    }, []);


    // Close dropdown when clicking outside
    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setShowNotifications(false);
            }

        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };

    }, []);


    // Toggle notification dropdown
    const handleNotificationClick = () => {

        const newState = !showNotifications;

        setShowNotifications(newState);

        if (newState) {
            fetchNotifications();
        }

    };


    // Mark one notification as read
    const handleMarkAsRead = async (notificationId) => {

        try {

            await api.put(
                `/notifications/${notificationId}/read`
            );

            setNotifications((previous) =>
                previous.map((notification) =>
                    notification._id === notificationId
                        ? {
                            ...notification,
                            isRead: true
                        }
                        : notification
                )
            );

            setUnreadCount((previous) =>
                Math.max(0, previous - 1)
            );

        } catch (error) {

            console.error(
                "Mark Notification Error:",
                error
            );

        }

    };


    // Mark all notifications as read
    const handleMarkAllAsRead = async () => {

        try {

            await api.put("/notifications/read-all");

            setNotifications((previous) =>
                previous.map((notification) => ({
                    ...notification,
                    isRead: true
                }))
            );

            setUnreadCount(0);

        } catch (error) {

            console.error(
                "Mark All Notifications Error:",
                error
            );

        }

    };


    // Delete notification
    const handleDeleteNotification = async (
        notificationId,
        isRead
    ) => {

        try {

            await api.delete(
                `/notifications/${notificationId}`
            );

            setNotifications((previous) =>
                previous.filter(
                    (notification) =>
                        notification._id !== notificationId
                )
            );

            if (!isRead) {
                setUnreadCount((previous) =>
                    Math.max(0, previous - 1)
                );
            }

        } catch (error) {

            console.error(
                "Delete Notification Error:",
                error
            );

        }

    };


    // Open notification
    // Open notification and navigate to the related file
const handleOpenNotification = async (notification) => {

    // Mark notification as read
    if (!notification.isRead) {
        await handleMarkAsRead(notification._id);
    }

    // Close notification dropdown
    setShowNotifications(false);

    // Navigate to the actual shared file
    if (notification.relatedFile?._id) {

        navigate(`/shared-file/${notification.relatedFile._id}`);

    } else if (notification.link) {

        navigate(notification.link);

    }

};


    // Format notification date
    const formatNotificationDate = (date) => {

        const notificationDate = new Date(date);
        const now = new Date();

        const difference = Math.floor(
            (now - notificationDate) / 1000
        );

        if (difference < 60) {
            return "Just now";
        }

        if (difference < 3600) {
            return `${Math.floor(difference / 60)}m ago`;
        }

        if (difference < 86400) {
            return `${Math.floor(difference / 3600)}h ago`;
        }

        if (difference < 604800) {
            return `${Math.floor(difference / 86400)}d ago`;
        }

        return notificationDate.toLocaleDateString();

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

                    <span className="search-shortcut">
                        ⌘ K
                    </span>

                </div>


                {/* NOTIFICATION BUTTON */}

                <div
                    className="notification-container"
                    ref={notificationRef}
                >

                    <button
                        className="notification-btn"
                        onClick={handleNotificationClick}
                        aria-label="Notifications"
                        aria-expanded={showNotifications}
                    >

                        <Bell size={20} />

                        {unreadCount > 0 && (

                            <span className="notification-count">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>

                        )}

                    </button>


                    {/* NOTIFICATION DROPDOWN */}

                    {showNotifications && (

                        <div className="notification-dropdown">

                            <div className="notification-header">

                                <div>
                                    <h3>Notifications</h3>

                                    <p>
                                        {unreadCount > 0
                                            ? `${unreadCount} unread notifications`
                                            : "You're all caught up"}
                                    </p>
                                </div>

                                <button
                                    className="notification-close"
                                    onClick={() => setShowNotifications(false)}
                                    aria-label="Close notifications"
                                >
                                    <X size={18} />
                                </button>

                            </div>


                            {unreadCount > 0 && (

                                <button
                                    className="mark-all-btn"
                                    onClick={handleMarkAllAsRead}
                                >
                                    <CheckCheck size={15} />
                                    Mark all as read
                                </button>

                            )}


                            <div className="notification-list">

                                {loadingNotifications && notifications.length === 0 ? (

                                    <div className="notification-empty">
                                        Loading notifications...
                                    </div>

                                ) : notifications.length === 0 ? (

                                    <div className="notification-empty">

                                        <BellRing size={30} />

                                        <h4>No notifications yet</h4>

                                        <p>
                                            Notifications will appear here.
                                        </p>

                                    </div>

                                ) : (

                                    notifications.map((notification) => (

                                        <div
                                            key={notification._id}
                                            className={`notification-item ${
                                                !notification.isRead ? "unread" : ""
                                            }`}
                                        >

                                            <button
                                                className="notification-item-content"
                                                onClick={() =>
                                                    handleOpenNotification(notification)
                                                }
                                            >

                                                <div className="notification-icon">
                                                    <Bell size={17} />
                                                </div>

                                                <div className="notification-details">

                                                    <h4>
                                                        {notification.title}
                                                    </h4>

                                                    <p>
                                                        {notification.message}
                                                    </p>

                                                    <span>
                                                        {formatNotificationDate(
                                                            notification.createdAt
                                                        )}
                                                    </span>

                                                </div>

                                            </button>


                                            <button
                                                className="notification-delete"
                                                onClick={() =>
                                                    handleDeleteNotification(
                                                        notification._id,
                                                        notification.isRead
                                                    )
                                                }
                                                aria-label="Delete notification"
                                            >
                                                <Trash2 size={15} />
                                            </button>

                                        </div>

                                    ))

                                )}

                            </div>


                            <div className="notification-footer">

                                <span>
                                    {notifications.length} notifications
                                </span>

                            </div>

                        </div>

                    )}

                </div>


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