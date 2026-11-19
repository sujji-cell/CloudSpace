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
    Clock3,
    RefreshCw,
    UploadCloud
} from "lucide-react";

import "./MyFiles.css";

function RecentFiles() {

    const [activeItem, setActiveItem] = useState("Recent");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [accessingFileId, setAccessingFileId] = useState(null);

    // LAST 5 DAYS IN MILLISECONDS
    const FIVE_DAYS = 5 * 24 * 60 * 60 * 1000;

    // FETCH RECENTLY ACCESSED FILES

    const fetchFiles = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/files");

            const uploadedFiles = response.data.files || [];

            const cutoffTime = Date.now() - FIVE_DAYS;

            // Keep files accessed within the last 5 days
            const recentFiles = uploadedFiles.filter((file) => {

                if (!file.lastAccessedAt) {
                    return false;
                }

                return new Date(file.lastAccessedAt).getTime() >= cutoffTime;

            });

            // Sort by most recently accessed
            recentFiles.sort(
                (a, b) =>
                    new Date(b.lastAccessedAt) -
                    new Date(a.lastAccessedAt)
            );

            setFiles(recentFiles);

        } catch (error) {

            console.error("Error fetching recent files:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load recent files."
            );

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        fetchFiles();

        window.addEventListener(
            "cloudspace-files-updated",
            fetchFiles
        );

        return () => {

            window.removeEventListener(
                "cloudspace-files-updated",
                fetchFiles
            );

        };

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

    // FORMAT LAST ACCESSED DATE AND TIME

    const formatDateTime = (date) => {

        if (!date) return "-";

        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    };

    // GET FILE ICON

    const getFileDetails = (mimeType = "") => {

        if (mimeType.startsWith("image/")) {
            return {
                icon: Image,
                className: "image"
            };
        }

        if (
            mimeType.includes("spreadsheet") ||
            mimeType.includes("excel") ||
            mimeType === "text/csv"
        ) {
            return {
                icon: FileSpreadsheet,
                className: "excel"
            };
        }

        if (
            mimeType.includes("zip") ||
            mimeType.includes("compressed")
        ) {
            return {
                icon: FileArchive,
                className: "zip"
            };
        }

        if (mimeType === "application/pdf") {
            return {
                icon: FileText,
                className: "pdf"
            };
        }

        if (
            mimeType.includes("word") ||
            mimeType.includes("document")
        ) {
            return {
                icon: FileText,
                className: "doc"
            };
        }

        return {
            icon: File,
            className: "default"
        };

    };

    // SEARCH FILES

    const filteredFiles = files.filter((file) =>
        file.originalName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
    );

    // GET AUTHORIZED FILE URL

    const getAuthorizedFileUrl = async (fileId) => {

        const response = await api.get(`/files/${fileId}/access`);

        if (!response.data.success || !response.data.accessUrl) {
            throw new Error("Unable to access this file.");
        }

        // Update last accessed time immediately
        const lastAccessedAt =
            response.data.lastAccessedAt || new Date().toISOString();

        setFiles((previousFiles) => {

            const updatedFiles = previousFiles.map((file) => {

                if (file._id === fileId) {

                    return {
                        ...file,
                        lastAccessedAt
                    };

                }

                return file;

            });

            return updatedFiles.sort(
                (a, b) =>
                    new Date(b.lastAccessedAt) -
                    new Date(a.lastAccessedAt)
            );

        });

        return response.data.accessUrl;

    };

    // PREVIEW FILE

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

    // DOWNLOAD FILE

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

                            <h1>Recent Files</h1>

                            <p>
                                Files accessed within the last 5 days.
                            </p>

                        </div>

                        <button
                            className="myfiles-refresh"
                            onClick={fetchFiles}
                            disabled={loading}
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>

                    </section>

                    {/* STATISTICS */}

                    <section className="myfiles-stats">

                        <div className="myfiles-stat-card">

                            <Clock3 size={22} />

                            <div>

                                <h3>{files.length}</h3>

                                <p>Recently Accessed</p>

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

                                <p>Recent Files Storage</p>

                            </div>

                        </div>

                    </section>

                    {/* SEARCH */}

                    <section className="myfiles-toolbar">

                        <div className="myfiles-search">

                            <Search size={19} />

                            <input
                                type="text"
                                placeholder="Search recent files..."
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />

                        </div>

                    </section>

                    {/* FILE TABLE */}

                    <section className="myfiles-table-section">

                        <div className="myfiles-table-heading">

                            <div>

                                <h2>Recently Accessed</h2>

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
                                <span>LAST ACCESSED</span>
                                <span>ACTIONS</span>

                            </div>

                            {/* LOADING */}

                            {loading && (

                                <div className="myfiles-message">
                                    Loading recent files...
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
                                        <Clock3 size={32} />
                                    </div>

                                    <h3>No recent files</h3>

                                    <p>
                                        Files you access will appear here for the next 5 days.
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

                                return (

                                    <div
                                        className="myfiles-row"
                                        key={file._id}
                                    >

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

                                        <span>
                                            {formatFileSize(file.size)}
                                        </span>

                                        <span>
                                            {formatDateTime(file.lastAccessedAt)}
                                        </span>

                                        <div className="myfiles-actions">

                                            <button
                                                title="Preview"
                                                disabled={isAccessing}
                                                onClick={() => handlePreview(file)}
                                            >
                                                <Eye size={18} />
                                            </button>

                                            <button
                                                title="Download"
                                                disabled={isAccessing}
                                                onClick={() => handleDownload(file)}
                                            >
                                                <Download size={18} />
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

export default RecentFiles;