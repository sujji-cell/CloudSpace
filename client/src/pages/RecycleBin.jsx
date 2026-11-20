import React, { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";

import {
    Trash2,
    Search,
    FileText,
    Image,
    FileSpreadsheet,
    FileArchive,
    File,
    RefreshCw,
    RotateCcw,
    AlertTriangle
} from "lucide-react";

import "./MyFiles.css";

function RecycleBin() {

    const [activeItem, setActiveItem] = useState("Recycle Bin");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");

    const [restoringFileId, setRestoringFileId] = useState(null);
    const [deletingFileId, setDeletingFileId] = useState(null);


    // FETCH RECYCLE BIN FILES

    const fetchRecycleBin = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/recycle-bin");

            setFiles(response.data.files || []);

        } catch (error) {

            console.error("Recycle Bin Fetch Error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load Recycle Bin files."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        fetchRecycleBin();

    }, []);


    // FORMAT FILE SIZE

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


    // FORMAT DATE

    const formatDate = (date) => {

        if (!date) return "Unknown";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    };


    // GET FILE ICON

    const getFileDetails = (mimeType = "") => {

        if (mimeType.startsWith("image/")) {
            return { icon: Image, className: "image" };
        }

        if (
            mimeType.includes("spreadsheet") ||
            mimeType.includes("excel") ||
            mimeType === "text/csv"
        ) {
            return { icon: FileSpreadsheet, className: "excel" };
        }

        if (
            mimeType.includes("zip") ||
            mimeType.includes("compressed")
        ) {
            return { icon: FileArchive, className: "zip" };
        }

        if (
            mimeType === "application/pdf" ||
            mimeType.includes("word") ||
            mimeType.includes("document")
        ) {
            return { icon: FileText, className: "pdf" };
        }

        return { icon: File, className: "default" };

    };


    // SEARCH FILES

    const filteredFiles = files.filter((file) =>
        file.originalName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
    );


    // RESTORE FILE

    const handleRestore = async (fileId) => {

        try {

            setRestoringFileId(fileId);

            const response = await api.put(
                `/recycle-bin/restore/${fileId}`
            );

            setFiles((prev) =>
                prev.filter((file) => file._id !== fileId)
            );

            window.dispatchEvent(
                new Event("cloudspace-files-updated")
            );

            window.dispatchEvent(
                new Event("cloudspace-recycle-bin-updated")
            );

            alert(
                response.data.message ||
                "File restored successfully!"
            );

        } catch (error) {

            console.error("Restore Error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to restore file."
            );

        } finally {

            setRestoringFileId(null);

        }

    };


    // PERMANENTLY DELETE FILE

    const handlePermanentDelete = async (fileId) => {

        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this file? This action cannot be undone."
        );

        if (!confirmed) return;

        try {

            setDeletingFileId(fileId);

            const response = await api.delete(
                `/recycle-bin/permanent/${fileId}`
            );

            setFiles((prev) =>
                prev.filter((file) => file._id !== fileId)
            );

            window.dispatchEvent(
                new Event("cloudspace-files-updated")
            );

            window.dispatchEvent(
                new Event("cloudspace-favorites-updated")
            );

            window.dispatchEvent(
                new Event("cloudspace-recycle-bin-updated")
            );

            alert(
                response.data.message ||
                "File permanently deleted!"
            );

        } catch (error) {

            console.error("Permanent Delete Error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to permanently delete file."
            );

        } finally {

            setDeletingFileId(null);

        }

    };


    // TOTAL RECYCLE BIN SIZE

    const totalSize = files.reduce(
        (total, file) => total + (file.size || 0),
        0
    );


    // PAGE UI

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

                            <h1>Recycle Bin</h1>

                            <p>
                                Restore deleted files or permanently remove them.
                            </p>

                        </div>

                        <button
                            className="myfiles-refresh"
                            onClick={fetchRecycleBin}
                            disabled={loading}
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>

                    </section>


                    {/* STATISTICS */}

                    <section className="myfiles-stats">

                        <div className="myfiles-stat-card">

                            <Trash2 size={22} />

                            <div>
                                <h3>{files.length}</h3>
                                <p>Deleted Files</p>
                            </div>

                        </div>

                        <div className="myfiles-stat-card">

                            <File size={22} />

                            <div>
                                <h3>{formatFileSize(totalSize)}</h3>
                                <p>Total Deleted Size</p>
                            </div>

                        </div>

                    </section>


                    {/* WARNING */}

                    <div className="recycle-bin-notice">

                        <AlertTriangle size={18} />

                        <p>
                            Deleted files are kept here until you restore
                            them or permanently delete them.
                        </p>

                    </div>


                    {/* SEARCH */}

                    <section className="myfiles-toolbar">

                        <div className="myfiles-search">

                            <Search size={19} />

                            <input
                                type="text"
                                placeholder="Search deleted files..."
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />

                        </div>

                    </section>


                    {/* RECYCLE BIN TABLE */}

                    <section className="myfiles-table-section">

                        <div className="myfiles-table-heading">

                            <div>

                                <h2>Deleted Files</h2>

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
                                <span>DATE DELETED</span>
                                <span>ACTIONS</span>

                            </div>


                            {/* LOADING */}

                            {loading && (

                                <div className="myfiles-message">
                                    Loading Recycle Bin...
                                </div>

                            )}


                            {/* ERROR */}

                            {!loading && error && (

                                <div className="myfiles-message error">

                                    {error}

                                    <button onClick={fetchRecycleBin}>
                                        Try Again
                                    </button>

                                </div>

                            )}


                            {/* EMPTY */}

                            {!loading && !error && filteredFiles.length === 0 && (

                                <div className="myfiles-empty">

                                    <div className="myfiles-empty-icon">
                                        <Trash2 size={32} />
                                    </div>

                                    <h3>
                                        {files.length === 0
                                            ? "Your Recycle Bin is empty"
                                            : "No matching files found"}
                                    </h3>

                                    <p>
                                        {files.length === 0
                                            ? "Files you delete will appear here."
                                            : "Try searching with a different file name."}
                                    </p>

                                </div>

                            )}


                            {/* FILE ROWS */}

                            {!loading && !error && filteredFiles.map((file) => {

                                const {
                                    icon: Icon,
                                    className
                                } = getFileDetails(file.mimeType);

                                const isRestoring =
                                    restoringFileId === file._id;

                                const isDeleting =
                                    deletingFileId === file._id;

                                const isProcessing =
                                    isRestoring || isDeleting;

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


                                        {/* DATE DELETED */}

                                        <span>
                                            {formatDate(file.deletedAt)}
                                        </span>


                                        {/* ACTIONS */}

                                        <div className="myfiles-actions">

                                            <button
                                                title="Restore File"
                                                disabled={isProcessing}
                                                onClick={() =>
                                                    handleRestore(file._id)
                                                }
                                            >
                                                <RotateCcw size={18} />
                                            </button>

                                            <button
                                                title="Permanently Delete"
                                                disabled={isProcessing}
                                                onClick={() =>
                                                    handlePermanentDelete(file._id)
                                                }
                                            >
                                                <Trash2 size={18} />
                                            </button>

                                        </div>

                                    </div>

                                );

                            })}

                        </div>

                    </section>


                    {/* FOOTER */}

                    <footer className="dashboard-footer">
                        CloudSpace © 2026 · Secure file storage and sharing
                    </footer>

                </div>

            </main>

        </div>

    );

}

export default RecycleBin;