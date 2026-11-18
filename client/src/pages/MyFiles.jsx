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
    AlertTriangle
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

    // Delete states
    const [deleteFileId, setDeleteFileId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // File access loading state
    const [accessingFileId, setAccessingFileId] = useState(null);


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


    useEffect(() => {

        fetchFiles();

    }, []);


    // --------------------------------
    // FORMAT FILE SIZE
    // --------------------------------

    const formatFileSize = (bytes) => {

        if (!bytes) return "0 B";

        if (bytes < 1024) {
            return `${bytes} B`;
        }

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

        const response = await api.get(
            `/files/${fileId}/access`
        );

        if (!response.data.success || !response.data.accessUrl) {
            throw new Error("Unable to access this file.");
        }

        return response.data.accessUrl;

    };


    // --------------------------------
    // PREVIEW FILE
    // --------------------------------

    const handlePreview = async (file) => {

        // Open a blank tab immediately to avoid popup blocking
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

            // Request permission from backend
            const accessUrl = await getAuthorizedFileUrl(file._id);

            // Download authorized file
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
    // DELETE FILE
    // --------------------------------

    const handleDelete = async () => {

        if (!deleteFileId) return;

        try {

            setDeleting(true);
            setDeleteError("");

            await api.delete(`/files/${deleteFileId}`);

            setFiles((prevFiles) =>
                prevFiles.filter(
                    (file) => file._id !== deleteFileId
                )
            );

            // Refresh storage in Dashboard and Sidebar
            window.dispatchEvent(
                new Event("cloudspace-files-updated")
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
                            onClick={fetchFiles}
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

                            {!loading &&
                                !error &&
                                filteredFiles.length === 0 && (

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

                            {!loading &&
                                !error &&
                                filteredFiles.map((file) => {

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

                                                {/* Preview */}

                                                <button
                                                    title="Preview"
                                                    disabled={isAccessing}
                                                    onClick={() =>
                                                        handlePreview(file)
                                                    }
                                                >

                                                    <Eye size={18} />

                                                </button>


                                                {/* Download */}

                                                <button
                                                    title="Download"
                                                    disabled={isAccessing}
                                                    onClick={() =>
                                                        handleDownload(file)
                                                    }
                                                >

                                                    <Download size={18} />

                                                </button>


                                                {/* Delete */}

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

                                        {deleting
                                            ? "Deleting..."
                                            : "Delete File"
                                        }

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