import React, { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";

import {
    Search,
    FileText,
    Image,
    FileSpreadsheet,
    FileArchive,
    File,
    Download,
    Eye,
    UploadCloud,
    Filter,
    RefreshCw,
    Trash2,
    X,
    AlertTriangle,
    Share2,
    Copy,
    Star
} from "lucide-react";

import "./MyFiles.css";

function MyFiles() {

    const [activeItem, setActiveItem] = useState("My Files");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [files, setFiles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("All Files");
    const [sortOrder, setSortOrder] = useState("newest");

    // Favourite states
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [favoriteUpdatingId, setFavoriteUpdatingId] = useState(null);

    // Delete states
    const [deleteFileId, setDeleteFileId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // File access state
    const [accessingFileId, setAccessingFileId] = useState(null);

    // Share states
    const [shareFile, setShareFile] = useState(null);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [sharing, setSharing] = useState(false);
    const [shareError, setShareError] = useState("");
    const [shareSuccess, setShareSuccess] = useState("");

    // Copy link state
    const [linkCopied, setLinkCopied] = useState(false);


    // --------------------------------
    // FETCH USER FILES
    // --------------------------------

    const fetchFiles = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/files");

            setFiles(response.data.files || []);

        } catch (error) {

            console.error("Error fetching files:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load your files."
            );

        } finally {

            setLoading(false);

        }

    };


    // --------------------------------
    // FETCH USER FAVOURITES
    // --------------------------------

    const fetchFavorites = async () => {

        try {

            const response = await api.get("/favorites");

            const ids = (response.data.favorites || [])
                .map((favorite) => favorite.file?._id)
                .filter(Boolean);

            setFavoriteIds(ids);

        } catch (error) {

            console.error("Error fetching favourites:", error);

        }

    };


    // --------------------------------
    // ADD / REMOVE FAVOURITE
    // --------------------------------

    const handleFavorite = async (fileId) => {

        try {

            setFavoriteUpdatingId(fileId);

            if (favoriteIds.includes(fileId)) {

                await api.delete(`/favorites/${fileId}`);

                setFavoriteIds((prev) =>
                    prev.filter((id) => id !== fileId)
                );

            } else {

                await api.post(`/favorites/${fileId}`);

                setFavoriteIds((prev) => [...prev, fileId]);

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
    // INITIAL DATA FETCH
    // --------------------------------

    useEffect(() => {

        fetchFiles();
        fetchFavorites();

    }, []);


    // --------------------------------
    // FORMAT FILE SIZE
    // --------------------------------

    const formatFileSize = (bytes) => {

        if (!bytes) return "0 B";

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
    // FORMAT DATE
    // --------------------------------

    const formatDate = (date) => {

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    };


    // --------------------------------
    // GET FILE ICON AND CATEGORY
    // --------------------------------

    const getFileDetails = (mimeType = "") => {

        if (mimeType.startsWith("image/")) {
            return {
                icon: Image,
                className: "image",
                category: "Images"
            };
        }

        if (
            mimeType.includes("spreadsheet") ||
            mimeType.includes("excel") ||
            mimeType === "text/csv"
        ) {
            return {
                icon: FileSpreadsheet,
                className: "excel",
                category: "Spreadsheets"
            };
        }

        if (
            mimeType.includes("zip") ||
            mimeType.includes("compressed")
        ) {
            return {
                icon: FileArchive,
                className: "zip",
                category: "Archives"
            };
        }

        if (mimeType === "application/pdf") {
            return {
                icon: FileText,
                className: "pdf",
                category: "PDF"
            };
        }

        if (
            mimeType.includes("word") ||
            mimeType.includes("document")
        ) {
            return {
                icon: FileText,
                className: "doc",
                category: "Documents"
            };
        }

        return {
            icon: File,
            className: "default",
            category: "Other"
        };

    };


    // --------------------------------
    // SEARCH AND FILTER FILES
    // --------------------------------

    const filteredFiles = files
        .filter((file) => {

            const matchesSearch = file.originalName
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase());

            const fileDetails = getFileDetails(file.mimeType);

            const matchesType =
                selectedType === "All Files" ||
                fileDetails.category === selectedType;

            return matchesSearch && matchesType;

        })
        .sort((a, b) => {

            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);

            return sortOrder === "newest"
                ? dateB - dateA
                : dateA - dateB;

        });


    // --------------------------------
    // GET AUTHORIZED FILE URL
    // --------------------------------

    const getAuthorizedFileUrl = async (fileId) => {

        const response = await api.get(`/files/${fileId}/access`);

        if (!response.data.success || !response.data.accessUrl) {
            throw new Error("Unable to access this file.");
        }

        return response.data.accessUrl;

    };


    // --------------------------------
    // PREVIEW FILE
    // --------------------------------

    const handlePreview = async (file) => {

        const newWindow = window.open("about:blank", "_blank");

        if (!newWindow) {
            alert("Please allow pop-ups to preview files.");
            return;
        }

        try {

            setAccessingFileId(file._id);

            const accessUrl = await getAuthorizedFileUrl(file._id);

            newWindow.location.href = accessUrl;

        } catch (error) {

            console.error("Preview error:", error);

            newWindow.close();

            alert(
                error.response?.data?.message ||
                error.message ||
                "Unable to preview this file."
            );

        } finally {

            setAccessingFileId(null);

        }

    };


    // --------------------------------
    // DOWNLOAD FILE
    // --------------------------------

    const handleDownload = async (file) => {

        try {

            setAccessingFileId(file._id);

            const accessUrl = await getAuthorizedFileUrl(file._id);

            const response = await fetch(accessUrl);

            if (!response.ok) {
                throw new Error("Unable to download file.");
            }

            const blob = await response.blob();

            const downloadUrl = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = downloadUrl;
            link.download = file.originalName;

            document.body.appendChild(link);

            link.click();

            link.remove();

            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 1000);

        } catch (error) {

            console.error("Download error:", error);

            alert(
                error.response?.data?.message ||
                error.message ||
                "Unable to download this file."
            );

        } finally {

            setAccessingFileId(null);

        }

    };


    // --------------------------------
    // OPEN SHARE MODAL
    // --------------------------------

    const openShareModal = (file) => {

        setShareFile(file);
        setRecipientEmail("");
        setShareError("");
        setShareSuccess("");
        setLinkCopied(false);

    };


    // --------------------------------
    // CLOSE SHARE MODAL
    // --------------------------------

    const closeShareModal = () => {

        if (sharing) return;

        setShareFile(null);
        setRecipientEmail("");
        setShareError("");
        setShareSuccess("");
        setLinkCopied(false);

    };


    // --------------------------------
    // SHARE FILE THROUGH EMAIL
    // --------------------------------

    const handleShare = async (e) => {

        e.preventDefault();

        if (!recipientEmail.trim()) {
            setShareError("Please enter the recipient's email address.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail.trim())) {
            setShareError("Please enter a valid email address.");
            return;
        }

        try {

            setSharing(true);
            setShareError("");
            setShareSuccess("");

            const response = await api.post("/shares", {
                fileId: shareFile._id,
                email: recipientEmail.trim().toLowerCase()
            });

            setShareSuccess(
                response.data.message || "File shared successfully!"
            );

        } catch (error) {

            console.error("Share error:", error);

            setShareError(
                error.response?.data?.message ||
                "Unable to share this file. Please try again."
            );

        } finally {

            setSharing(false);

        }

    };


    // --------------------------------
    // COPY RESTRICTED FILE LINK
    // --------------------------------

    const handleCopyLink = async () => {

        if (!shareFile) return;

        const shareLink =
            `${window.location.origin}/shared-file/${shareFile._id}`;

        try {

            await navigator.clipboard.writeText(shareLink);

            setLinkCopied(true);

            setTimeout(() => {
                setLinkCopied(false);
            }, 2500);

        } catch (error) {

            console.error("Copy Link Error:", error);

            alert("Unable to copy link. Please try again.");

        }

    };


    // --------------------------------
    // DELETE FILE
    // --------------------------------

    const handleDelete = async () => {

        if (!deleteFileId) return;

        try {

            setDeleting(true);
            setDeleteError("");

            await api.delete(`/files/${deleteFileId}`);

            setFiles((prevFiles) =>
                prevFiles.filter((file) => file._id !== deleteFileId)
            );

            // Remove deleted file from local favourites too
            setFavoriteIds((prev) =>
                prev.filter((id) => id !== deleteFileId)
            );

            window.dispatchEvent(
                new Event("cloudspace-files-updated")
            );

            window.dispatchEvent(
                new Event("cloudspace-favorites-updated")
            );

            setDeleteFileId(null);

        } catch (error) {

            console.error("Delete error:", error);

            setDeleteError(
                error.response?.data?.message ||
                "Unable to delete this file. Please try again."
            );

        } finally {

            setDeleting(false);

        }

    };


    // --------------------------------
    // DASHBOARD UI
    // --------------------------------

    return (

        <div className="app-layout">

            <Sidebar
                activeItem={activeItem}
                setActiveItem={setActiveItem}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="main-content">

                <Navbar
                    activeItem={activeItem}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <div className="myfiles-content">

                    {/* PAGE HEADER */}

                    <section className="myfiles-heading">

                        <div>

                            <p className="myfiles-label">
                                YOUR WORKSPACE
                            </p>

                            <h1>My Files</h1>

                            <p>
                                Manage, organize and access all your uploaded files.
                            </p>

                        </div>

                        <button
                            className="myfiles-refresh"
                            onClick={() => {
                                fetchFiles();
                                fetchFavorites();
                            }}
                            disabled={loading}
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>

                    </section>


                    {/* FILE STATISTICS */}

                    <section className="myfiles-stats">

                        <div className="myfiles-stat-card">

                            <FileText size={22} />

                            <div>
                                <h3>{files.length}</h3>
                                <p>Total Files</p>
                            </div>

                        </div>

                        <div className="myfiles-stat-card">

                            <UploadCloud size={22} />

                            <div>
                                <h3>
                                    {formatFileSize(
                                        files.reduce(
                                            (total, file) =>
                                                total + (file.size || 0),
                                            0
                                        )
                                    )}
                                </h3>

                                <p>Total Storage Used</p>
                            </div>

                        </div>

                    </section>


                    {/* SEARCH AND FILTER */}

                    <section className="myfiles-toolbar">

                        <div className="myfiles-search">

                            <Search size={19} />

                            <input
                                type="text"
                                placeholder="Search your files..."
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />

                        </div>

                        <div className="myfiles-filter">

                            <Filter size={17} />

                            <select
                                value={selectedType}
                                onChange={(e) =>
                                    setSelectedType(e.target.value)
                                }
                            >
                                <option value="All Files">All Files</option>
                                <option value="PDF">PDF</option>
                                <option value="Images">Images</option>
                                <option value="Documents">Documents</option>
                                <option value="Spreadsheets">Spreadsheets</option>
                                <option value="Archives">Archives</option>
                                <option value="Other">Other</option>
                            </select>

                        </div>

                        <select
                            className="myfiles-sort"
                            value={sortOrder}
                            onChange={(e) =>
                                setSortOrder(e.target.value)
                            }
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>

                    </section>


                    {/* FILE LIST */}

                    <section className="myfiles-table-section">

                        <div className="myfiles-table-heading">

                            <div>
                                <h2>All Files</h2>

                                <p>
                                    {filteredFiles.length} files found
                                </p>
                            </div>

                        </div>

                        <div className="myfiles-table">

                            {/* TABLE HEADER */}

                            <div className="myfiles-table-header">

                                <span>FILE NAME</span>
                                <span>FILE SIZE</span>
                                <span>DATE UPLOADED</span>
                                <span>ACTIONS</span>

                            </div>


                            {/* LOADING */}

                            {loading && (
                                <div className="myfiles-message">
                                    Loading your files...
                                </div>
                            )}


                            {/* ERROR */}

                            {!loading && error && (
                                <div className="myfiles-message error">

                                    {error}

                                    <button onClick={fetchFiles}>
                                        Try Again
                                    </button>

                                </div>
                            )}


                            {/* EMPTY */}

                            {!loading && !error && filteredFiles.length === 0 && (

                                <div className="myfiles-empty">

                                    <div className="myfiles-empty-icon">
                                        <UploadCloud size={32} />
                                    </div>

                                    <h3>No files found</h3>

                                    <p>
                                        Try changing your search or filter.
                                    </p>

                                </div>

                            )}


                            {/* FILE ROWS */}

                            {!loading && !error && filteredFiles.map((file) => {

                                const {
                                    icon: Icon,
                                    className
                                } = getFileDetails(file.mimeType);

                                const isAccessing =
                                    accessingFileId === file._id;

                                const isFavorite =
                                    favoriteIds.includes(file._id);

                                return (

                                    <div
                                        className="myfiles-row"
                                        key={file._id}
                                    >

                                        {/* FILE NAME */}

                                        <div className="myfiles-name">

                                            <div className={`file-icon ${className}`}>
                                                <Icon size={21} />
                                            </div>

                                            <div>
                                                <h4>{file.originalName}</h4>

                                                <p>
                                                    {file.format?.toUpperCase() || "FILE"}
                                                </p>
                                            </div>

                                        </div>


                                        {/* FILE SIZE */}

                                        <span>
                                            {formatFileSize(file.size)}
                                        </span>


                                        {/* DATE */}

                                        <span>
                                            {formatDate(file.createdAt)}
                                        </span>


                                        {/* ACTIONS */}

                                        <div className="myfiles-actions">

                                            {/* FAVOURITE BUTTON */}

                                            <button
                                                title={
                                                    isFavorite
                                                        ? "Remove from Favourites"
                                                        : "Add to Favourites"
                                                }
                                                className={
                                                    isFavorite
                                                        ? "favorite-file-btn active"
                                                        : "favorite-file-btn"
                                                }
                                                disabled={favoriteUpdatingId === file._id}
                                                onClick={() => handleFavorite(file._id)}
                                            >
                                                <Star
                                                    size={18}
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
                                                disabled={isAccessing}
                                                onClick={() => handlePreview(file)}
                                            >
                                                <Eye size={18} />
                                            </button>


                                            {/* DOWNLOAD */}

                                            <button
                                                title="Download"
                                                disabled={isAccessing}
                                                onClick={() => handleDownload(file)}
                                            >
                                                <Download size={18} />
                                            </button>


                                            {/* SHARE */}

                                            <button
                                                title="Share"
                                                className="share-file-btn"
                                                onClick={() => openShareModal(file)}
                                            >
                                                <Share2 size={18} />
                                            </button>


                                            {/* DELETE */}

                                            <button
                                                title="Delete"
                                                className="delete-file-btn"
                                                onClick={() => {
                                                    setDeleteFileId(file._id);
                                                    setDeleteError("");
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    </section>


                    {/* SHARE MODAL */}

                    {shareFile && (

                        <div
                            className="share-modal-overlay"
                            onClick={closeShareModal}
                        >

                            <div
                                className="share-modal"
                                onClick={(e) => e.stopPropagation()}
                            >

                                <button
                                    className="share-modal-close"
                                    onClick={closeShareModal}
                                    disabled={sharing}
                                >
                                    <X size={20} />
                                </button>

                                <div className="share-modal-icon">
                                    <Share2 size={25} />
                                </div>

                                <h2>Share File</h2>

                                <p className="share-modal-description">
                                    Share this file with another CloudSpace user.
                                </p>

                                <div className="share-file-info">
                                    <FileText size={19} />

                                    <span>{shareFile.originalName}</span>
                                </div>


                                {/* COPY LINK SECTION */}

                                <div className="share-link-section">

                                    <p>Or copy a restricted link</p>

                                    <button
                                        type="button"
                                        className="copy-share-link-btn"
                                        onClick={handleCopyLink}
                                    >
                                        <Copy size={18} />

                                        {linkCopied
                                            ? "Link Copied!"
                                            : "Copy Link"}
                                    </button>

                                    <small>
                                        Only CloudSpace users who have already
                                        been granted access by email can open this link.
                                    </small>

                                </div>


                                {/* EMAIL SHARING FORM */}

                                <form onSubmit={handleShare}>

                                    <label htmlFor="recipientEmail">
                                        Recipient's Email Address
                                    </label>

                                    <input
                                        id="recipientEmail"
                                        type="email"
                                        placeholder="Enter registered email address"
                                        value={recipientEmail}
                                        onChange={(e) => {
                                            setRecipientEmail(e.target.value);
                                            setShareError("");
                                            setShareSuccess("");
                                        }}
                                        required
                                        disabled={sharing || !!shareSuccess}
                                    />

                                    {shareError && (
                                        <p className="share-error-message">
                                            {shareError}
                                        </p>
                                    )}

                                    {shareSuccess && (
                                        <p className="share-success-message">
                                            {shareSuccess}
                                        </p>
                                    )}

                                    <div className="share-modal-actions">

                                        <button
                                            type="button"
                                            className="share-cancel-btn"
                                            onClick={closeShareModal}
                                            disabled={sharing}
                                        >
                                            Close
                                        </button>

                                        <button
                                            type="submit"
                                            className="share-submit-btn"
                                            disabled={sharing || !!shareSuccess}
                                        >
                                            {sharing ? "Sharing..." : "Share File"}
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>

                    )}


                    {/* DELETE CONFIRMATION MODAL */}

                    {deleteFileId && (

                        <div className="delete-modal-overlay">

                            <div className="delete-modal">

                                <div className="delete-modal-icon">
                                    <AlertTriangle size={27} />
                                </div>

                                <button
                                    className="delete-modal-close"
                                    onClick={() => {
                                        setDeleteFileId(null);
                                        setDeleteError("");
                                    }}
                                    disabled={deleting}
                                >
                                    <X size={20} />
                                </button>

                                <h2>Delete this file?</h2>

                                <p>
                                    This file will be permanently deleted
                                    from your CloudSpace account.
                                    You won't be able to recover it.
                                </p>

                                {deleteError && (
                                    <p className="delete-error">
                                        {deleteError}
                                    </p>
                                )}

                                <div className="delete-modal-actions">

                                    <button
                                        className="cancel-delete-btn"
                                        onClick={() => {
                                            setDeleteFileId(null);
                                            setDeleteError("");
                                        }}
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="confirm-delete-btn"
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? "Deleting..." : "Delete File"}
                                    </button>

                                </div>

                            </div>

                        </div>

                    )}


                    {/* FOOTER */}

                    <footer className="dashboard-footer">
                        CloudSpace © 2026 · Secure file storage and sharing
                    </footer>

                </div>

            </main>

        </div>

    );

}

export default MyFiles;