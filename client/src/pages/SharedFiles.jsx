import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";

import {
    Share2,
    Users,
    Download,
    Eye,
    Trash2,
    RefreshCw,
    FileText,
    FolderOpen,
    Star
} from "lucide-react";

import "./SharedFiles.css";

function SharedFiles() {

    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("by-me");

    const [sharedByMe, setSharedByMe] = useState([]);
    const [sharedWithMe, setSharedWithMe] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionLoading, setActionLoading] = useState("");

    // Favourite states
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [favoriteUpdatingId, setFavoriteUpdatingId] = useState(null);


    // --------------------------------
    // FETCH SHARED FILES
    // --------------------------------

    const fetchSharedFiles = async () => {

        try {

            setLoading(true);
            setError("");

            const [byMeResponse, withMeResponse] = await Promise.all([
                api.get("/shares/by-me"),
                api.get("/shares/with-me")
            ]);

            setSharedByMe(
                byMeResponse.data.shares || byMeResponse.data
            );

            setSharedWithMe(
                withMeResponse.data.shares || withMeResponse.data
            );

        } catch (err) {

            console.error("Error fetching shared files:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load shared files."
            );

        } finally {

            setLoading(false);

        }

    };


    // --------------------------------
    // FETCH FAVOURITES
    // --------------------------------

    const fetchFavorites = async () => {

        try {

            const response = await api.get("/favorites");

            const ids = (response.data.favorites || [])
                .map((favorite) => favorite.file?._id)
                .filter(Boolean);

            setFavoriteIds(ids);

        } catch (error) {

            console.error("Unable to fetch favourites:", error);

        }

    };


    // --------------------------------
    // INITIAL FETCH
    // --------------------------------

    useEffect(() => {

        fetchSharedFiles();
        fetchFavorites();

    }, []);


    // --------------------------------
    // ADD / REMOVE FAVOURITE
    // --------------------------------

    const handleFavorite = async (fileId) => {

        try {

            setFavoriteUpdatingId(fileId);

            if (favoriteIds.includes(fileId)) {

                await api.delete(`/favorites/${fileId}`);

                setFavoriteIds((previous) =>
                    previous.filter((id) => id !== fileId)
                );

            } else {

                await api.post(`/favorites/${fileId}`);

                setFavoriteIds((previous) => [...previous, fileId]);

            }

            window.dispatchEvent(
                new Event("cloudspace-favorites-updated")
            );

        } catch (error) {

            console.error("Favourite error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to update favourite."
            );

        } finally {

            setFavoriteUpdatingId(null);

        }

    };


    // --------------------------------
    // GET FILE SIZE
    // --------------------------------

    const formatFileSize = (bytes) => {

        if (!bytes) return "0 B";

        const sizes = ["B", "KB", "MB", "GB"];

        const index = Math.min(
            Math.floor(Math.log(bytes) / Math.log(1024)),
            sizes.length - 1
        );

        return (
            (bytes / Math.pow(1024, index)).toFixed(2) +
            " " +
            sizes[index]
        );

    };


    // --------------------------------
    // FORMAT DATE
    // --------------------------------

    const formatDate = (date) => {

        if (!date) return "N/A";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    };


    // --------------------------------
    // GET ACCESS URL
    // --------------------------------

    const getFileAccessUrl = async (fileId) => {

        const response = await api.get(`/files/${fileId}/access`);

        return (
            response.data.url ||
            response.data.fileUrl ||
            response.data.accessUrl
        );

    };


    // --------------------------------
    // PREVIEW FILE
    // --------------------------------

    const handlePreview = async (fileId) => {

        try {

            setActionLoading(fileId);

            const url = await getFileAccessUrl(fileId);

            if (!url) {
                throw new Error("File access URL was not returned.");
            }

            window.open(url, "_blank", "noopener,noreferrer");

        } catch (err) {

            console.error("Preview error:", err);

            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to preview this file."
            );

        } finally {

            setActionLoading("");

        }

    };


    // --------------------------------
    // DOWNLOAD FILE
    // --------------------------------

    // --------------------------------
    // DOWNLOAD FILE
    // --------------------------------

    const handleDownload = async (fileId, fileName) => {

        try {

            setActionLoading(fileId);

            const url = await getFileAccessUrl(fileId);

            if (!url) {
                throw new Error("File access URL was not returned.");
            }

            // Fetch the actual file
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Unable to download file.");
            }

            // Convert response into a Blob
            const blob = await response.blob();

            // Create a temporary download URL
            const downloadUrl = window.URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = fileName || "download";

            document.body.appendChild(link);

            // Trigger download
            link.click();

            // Clean up
            link.remove();

            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 1000);

        } catch (err) {

            console.error("Download error:", err);

            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to download this file."
            );

        } finally {

            setActionLoading("");

        }

    };

    // --------------------------------
    // REVOKE FILE ACCESS
    // --------------------------------

    const handleRevoke = async (shareId) => {

        const confirmRevoke = window.confirm(
            "Are you sure you want to revoke access to this file?"
        );

        if (!confirmRevoke) return;

        try {

            setActionLoading(shareId);

            await api.delete(`/shares/${shareId}`);

            setSharedByMe((previous) =>
                previous.filter((share) => share._id !== shareId)
            );

            alert("File access revoked successfully.");

        } catch (err) {

            console.error("Revoke error:", err);

            alert(
                err.response?.data?.message ||
                "Unable to revoke file access."
            );

        } finally {

            setActionLoading("");

        }

    };


    // --------------------------------
    // REMOVE FILE SHARED WITH ME
    // --------------------------------

    const handleRemoveSharedFile = async (shareId) => {

        const confirmRemove = window.confirm(
            "Are you sure you want to remove this shared file from your account?"
        );

        if (!confirmRemove) return;

        try {

            setActionLoading(shareId);

            await api.delete(`/shares/remove/${shareId}`);

            setSharedWithMe((previous) =>
                previous.filter((share) => share._id !== shareId)
            );

            alert("Shared file removed successfully.");

        } catch (err) {

            console.error("Remove shared file error:", err);

            alert(
                err.response?.data?.message ||
                "Unable to remove shared file."
            );

        } finally {

            setActionLoading("");

        }

    };


    // --------------------------------
    // GET FILE FROM SHARE
    // --------------------------------

    const getFile = (share) => {

        return share.file || {};

    };


    // --------------------------------
    // GET PERSON DETAILS
    // --------------------------------

    const getPerson = (share) => {

        return activeTab === "by-me"
            ? share.recipient || {}
            : share.owner || {};

    };


    const currentFiles =
        activeTab === "by-me" ? sharedByMe : sharedWithMe;


    // --------------------------------
    // PAGE UI
    // --------------------------------

    return (

        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Navbar />

                <div className="shared-files-content">

                    {/* HEADING */}

                    <div className="shared-files-heading">

                        <div>

                            <h1>Shared Files</h1>

                            <p>
                                Manage files you share and files shared with you.
                            </p>

                        </div>

                        <button
                            className="refresh-button"
                            onClick={() => {
                                fetchSharedFiles();
                                fetchFavorites();
                            }}
                            disabled={loading}
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                    </div>


                    {/* STATISTICS */}

                    <div className="shared-files-stats">

                        <div className="shared-stat-card">

                            <div className="shared-stat-icon">
                                <Share2 size={22} />
                            </div>

                            <div>
                                <h2>{sharedByMe.length}</h2>
                                <p>Files I Shared</p>
                            </div>

                        </div>


                        <div className="shared-stat-card">

                            <div className="shared-stat-icon">
                                <Users size={22} />
                            </div>

                            <div>
                                <h2>{sharedWithMe.length}</h2>
                                <p>Shared With Me</p>
                            </div>

                        </div>

                    </div>


                    {/* TABS */}

                    <div className="shared-files-tabs">

                        <button
                            className={
                                activeTab === "by-me" ? "active" : ""
                            }
                            onClick={() => setActiveTab("by-me")}
                        >
                            <Share2 size={17} />
                            Files I Shared
                            <span>{sharedByMe.length}</span>
                        </button>


                        <button
                            className={
                                activeTab === "with-me" ? "active" : ""
                            }
                            onClick={() => setActiveTab("with-me")}
                        >
                            <Users size={17} />
                            Shared With Me
                            <span>{sharedWithMe.length}</span>
                        </button>

                    </div>


                    {/* FILE LIST */}

                    <div className="shared-files-list">

                        {loading ? (

                            <div className="shared-loading">

                                <RefreshCw size={24} className="spin" />

                                <p>Loading shared files...</p>

                            </div>

                        ) : error ? (

                            <div className="shared-error">

                                <p>{error}</p>

                                <button onClick={fetchSharedFiles}>
                                    Try Again
                                </button>

                            </div>

                        ) : currentFiles.length === 0 ? (

                            <div className="shared-empty">

                                <FolderOpen size={45} />

                                <h3>
                                    {activeTab === "by-me"
                                        ? "You haven't shared any files yet"
                                        : "No files have been shared with you"}
                                </h3>

                                <p>
                                    {activeTab === "by-me"
                                        ? "Files you share with other users will appear here."
                                        : "When someone shares a file with you, it will appear here."}
                                </p>

                                <button
                                    onClick={() => navigate("/my-files")}
                                >
                                    Go to My Files
                                </button>

                            </div>

                        ) : (

                            <div className="shared-files-table">


                                {/* TABLE HEADER */}

                                <div className="shared-files-row shared-files-header">

                                    <span>File</span>

                                    <span>
                                        {activeTab === "by-me"
                                            ? "Shared With"
                                            : "Shared By"}
                                    </span>

                                    <span>Date Shared</span>

                                    <span>Size</span>

                                    <span>Actions</span>

                                </div>


                                {/* FILE ROWS */}

                                {currentFiles.map((share) => {

                                    const file = getFile(share);

                                    const person = getPerson(share);

                                    const fileId = file._id;

                                    const personName = [
                                        person.firstName,
                                        person.middleName,
                                        person.lastName
                                    ]
                                        .filter(Boolean)
                                        .join(" ") || person.email || "User";

                                    const isFavorite =
                                        favoriteIds.includes(fileId);

                                    return (

                                        <div
                                            className="shared-files-row"
                                            key={share._id}
                                        >


                                            {/* FILE */}

                                            <div className="shared-file-name">

                                                <div className="shared-file-icon">
                                                    <FileText size={20} />
                                                </div>

                                                <div>

                                                    <h4>
                                                        {file.originalName || "Untitled file"}
                                                    </h4>

                                                    <p>
                                                        {file.mimeType || "File"}
                                                    </p>

                                                </div>

                                            </div>


                                            {/* PERSON */}

                                            <div className="shared-person">

                                                <strong>{personName}</strong>

                                                <p>{person.email || ""}</p>

                                            </div>


                                            {/* DATE */}

                                            <span className="shared-date">
                                                {formatDate(share.createdAt)}
                                            </span>


                                            {/* SIZE */}

                                            <span className="shared-size">
                                                {formatFileSize(file.size)}
                                            </span>


                                            {/* ACTIONS */}

                                            <div className="shared-row-actions">


                                                {/* FAVOURITE BUTTON */}

                                                <button
                                                    className={
                                                        isFavorite
                                                            ? "shared-favorite-button active"
                                                            : "shared-favorite-button"
                                                    }
                                                    title={
                                                        isFavorite
                                                            ? "Remove from Favourites"
                                                            : "Add to Favourites"
                                                    }
                                                    onClick={() =>
                                                        handleFavorite(fileId)
                                                    }
                                                    disabled={
                                                        favoriteUpdatingId === fileId
                                                    }
                                                >

                                                    <Star
                                                        size={17}
                                                        fill={
                                                            isFavorite
                                                                ? "currentColor"
                                                                : "none"
                                                        }
                                                    />

                                                </button>


                                                {/* PREVIEW */}

                                                <button
                                                    title="Preview"
                                                    onClick={() =>
                                                        handlePreview(fileId)
                                                    }
                                                    disabled={
                                                        actionLoading === fileId
                                                    }
                                                >
                                                    <Eye size={17} />
                                                </button>


                                                {/* DOWNLOAD */}

                                                <button
                                                    title="Download"
                                                    onClick={() =>
                                                        handleDownload(
                                                            fileId,
                                                            file.originalName
                                                        )
                                                    }
                                                    disabled={
                                                        actionLoading === fileId
                                                    }
                                                >
                                                    <Download size={17} />
                                                </button>


                                                {/* REVOKE ACCESS */}

                                                {activeTab === "by-me" && (

                                                    <button
                                                        className="revoke-button"
                                                        title="Revoke access"
                                                        onClick={() =>
                                                            handleRevoke(share._id)
                                                        }
                                                        disabled={
                                                            actionLoading === share._id
                                                        }
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>

                                                )}

                                                {/* REMOVE SHARED FILE */}

                                                {activeTab === "with-me" && (

                                                    <button
                                                        className="revoke-button"
                                                        title="Remove from Shared With Me"
                                                        onClick={() =>
                                                            handleRemoveSharedFile(share._id)
                                                        }
                                                        disabled={actionLoading === share._id}
                                                    >
                                                        <Trash2 size={17} />
                                                    </button>

                                                )}

                                            </div>

                                        </div>

                                    );

                                })}

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

}

export default SharedFiles;