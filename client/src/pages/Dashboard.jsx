import React, { useState, useEffect, useRef } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";

import {
    UploadCloud,
    FileText,
    Image,
    FileSpreadsheet,
    FileArchive,
    MoreHorizontal,
    ArrowUpRight,
    Plus,
    FolderPlus
} from "lucide-react";


function Dashboard() {

    const [activeItem, setActiveItem] = useState("Dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Logged-in user information
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);

    // Uploaded files
    const [files, setFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(true);
    const [filesError, setFilesError] = useState("");

    // File upload states
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const [uploadSuccess, setUploadSuccess] = useState(false);


    // --------------------------------
    // FETCH LOGGED-IN USER
    // --------------------------------

    const fetchUser = async () => {

        try {

            const response = await api.get("/auth/me");

            const currentUser = response.data.user || response.data;

            setUser(currentUser);

        } catch (error) {

            console.error(
                "Failed to fetch user:",
                error.response?.data || error.message
            );

        } finally {

            setUserLoading(false);

        }

    };


    // --------------------------------
    // FETCH UPLOADED FILES
    // --------------------------------

    const fetchFiles = async () => {

        try {

            setFilesLoading(true);
            setFilesError("");

            const response = await api.get("/files");

            setFiles(response.data.files || []);

        } catch (error) {

            console.error(
                "Failed to fetch files:",
                error.response?.data || error.message
            );

            setFilesError("Unable to load your files.");

        } finally {

            setFilesLoading(false);

        }

    };


    // --------------------------------
    // INITIAL DATA + AUTO REFRESH
    // --------------------------------

    useEffect(() => {

        // Fetch initial data
        fetchUser();
        fetchFiles();


        // Refresh data whenever files change
        const handleFilesUpdated = () => {

            fetchUser();
            fetchFiles();

        };


        window.addEventListener(
            "cloudspace-files-updated",
            handleFilesUpdated
        );


        // Remove listener when Dashboard unmounts
        return () => {

            window.removeEventListener(
                "cloudspace-files-updated",
                handleFilesUpdated
            );

        };

    }, []);


    // --------------------------------
    // HANDLE FILE UPLOAD
    // --------------------------------

    const handleFileUpload = async (event) => {

        const selectedFile = event.target.files[0];

        if (!selectedFile) return;

        try {

            setUploading(true);
            setUploadMessage("");
            setUploadSuccess(false);

            const formData = new FormData();

            formData.append("file", selectedFile);

            const response = await api.post(
                "/files/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            console.log("Upload Response:", response.data);

            setUploadMessage("File uploaded successfully!");
            setUploadSuccess(true);

            // Notify Dashboard and Sidebar
            // to refresh their storage information
            window.dispatchEvent(
                new Event("cloudspace-files-updated")
            );

        } catch (error) {

            console.error(
                "Upload Error:",
                error.response?.data || error.message
            );

            setUploadMessage(
                error.response?.data?.message ||
                "File upload failed. Please try again."
            );

            setUploadSuccess(false);

        } finally {

            setUploading(false);

            // Allow selecting the same file again
            event.target.value = "";

        }

    };


    // --------------------------------
    // FORMAT FILE SIZE
    // --------------------------------

    const formatFileSize = (bytes) => {

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
    // GET FILE ICON
    // --------------------------------

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

        return {
            icon: FileText,
            className: "pdf"
        };

    };


    // --------------------------------
    // FORMAT UPLOAD DATE
    // --------------------------------

    const formatDate = (date) => {

        return new Date(date).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    };


    // --------------------------------
    // GREETING
    // --------------------------------

    const getGreeting = () => {

        const hour = new Date().getHours();

        if (hour < 12) {
            return "Good morning";
        }

        if (hour < 17) {
            return "Good afternoon";
        }

        return "Good evening";

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
                user={user}
            />


            <main className="main-content">

                <Navbar
                    activeItem={activeItem}
                    onMenuClick={() => setSidebarOpen(true)}
                />


                <div className="dashboard-content">


                    {/* Hidden File Input */}

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                    />


                    {/* Upload Message */}

                    {uploadMessage && (

                        <p
                            style={{
                                textAlign: "center",
                                margin: "10px 0",
                                color: uploadSuccess ? "green" : "red",
                                fontWeight: "500"
                            }}
                        >
                            {uploadMessage}
                        </p>

                    )}


                    {/* Welcome Section */}

                    <section className="welcome-section">

                        <div>

                            <p className="welcome-date">
                                YOUR WORKSPACE
                            </p>

                            <h1>
                                {getGreeting()}, {
                                    userLoading
                                        ? "..."
                                        : user?.firstName ||
                                        user?.name?.trim().split(/\s+/)[0] ||
                                        "there"
                                } 👋
                            </h1>

                            <p className="welcome-description">
                                Here's what's happening with your files today.
                            </p>

                        </div>


                        <div className="welcome-actions">

                            <button className="secondary-btn">

                                <FolderPlus size={17} />

                                New Folder

                            </button>


                            <button
                                className="primary-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >

                                <Plus size={18} />

                                {uploading ? "Uploading..." : "Upload Files"}

                            </button>

                        </div>

                    </section>


                    {/* STATISTICS */}

                    <section className="stats-grid">


                        {/* Total Files */}

                        <div className="stat-card">

                            <div className="stat-top">

                                <span>Total Files</span>

                                <div className="stat-icon purple">
                                    <FileText size={20} />
                                </div>

                            </div>

                            <h2>
                                {filesLoading ? "..." : files.length}
                            </h2>

                            <p>Files in your workspace</p>

                        </div>


                        {/* Storage Used */}

                        <div className="stat-card">

                            <div className="stat-top">

                                <span>Storage Used</span>

                                <div className="stat-icon blue">
                                    <UploadCloud size={20} />
                                </div>

                            </div>

                            <h2>
                                {userLoading
                                    ? "..."
                                    : formatFileSize(user?.storageUsed || 0)
                                }
                            </h2>

                            <p>
                                Of {formatFileSize(
                                    user?.storageLimit ||
                                    10 * 1024 * 1024 * 1024
                                )} available
                            </p>

                        </div>


                        {/* Shared Files */}

                        <div className="stat-card">

                            <div className="stat-top">

                                <span>Shared Files</span>

                                <div className="stat-icon green">
                                    <ArrowUpRight size={20} />
                                </div>

                            </div>

                            <h2>0</h2>

                            <p>Files shared with others</p>

                        </div>

                    </section>


                    {/* UPLOAD SECTION */}

                    <section className="upload-section">

                        <div className="upload-content">

                            <div className="upload-icon">
                                <UploadCloud size={28} />
                            </div>

                            <div>

                                <h3>Upload your files</h3>

                                <p>
                                    Keep your documents, images and other files
                                    organized in one place.
                                </p>

                            </div>

                        </div>


                        <button
                            className="upload-action"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                        >

                            {uploading ? "Uploading..." : "Browse Files"}

                        </button>

                    </section>


                    {/* RECENT FILES */}

                    <section className="files-section">

                        <div className="section-heading">

                            <div>

                                <h2>Recent Files</h2>

                                <p>
                                    Your recently uploaded documents
                                </p>

                            </div>


                            <button
                                className="view-all-btn"
                                onClick={() => {
                                    setActiveItem("My Files");
                                    window.location.href = "/my-files";
                                }}
                            >

                                View all

                                <ArrowUpRight size={16} />

                            </button>

                        </div>


                        <div className="files-table">


                            {/* TABLE HEADER */}

                            <div className="files-table-header">

                                <span>NAME</span>

                                <span>FILE SIZE</span>

                                <span>LAST MODIFIED</span>

                                <span></span>

                            </div>


                            {/* LOADING STATE */}

                            {filesLoading && (

                                <p style={{ padding: "20px" }}>
                                    Loading your files...
                                </p>

                            )}


                            {/* ERROR STATE */}

                            {!filesLoading && filesError && (

                                <p style={{ padding: "20px", color: "red" }}>
                                    {filesError}
                                </p>

                            )}


                            {/* EMPTY STATE */}

                            {!filesLoading &&
                                !filesError &&
                                files.length === 0 && (

                                    <p style={{ padding: "20px" }}>
                                        No files uploaded yet. Start by uploading your first file!
                                    </p>

                                )}


                            {/* DISPLAY UPLOADED FILES */}

                            {!filesLoading &&
                                !filesError &&
                                files.map((file) => {

                                    const {
                                        icon: Icon,
                                        className
                                    } = getFileDetails(file.mimeType || "");


                                    return (

                                        <div
                                            className="file-row"
                                            key={file._id}
                                        >


                                            {/* FILE NAME */}

                                            <div className="file-name">

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

                                            <span className="file-size">
                                                {formatFileSize(file.size)}
                                            </span>


                                            {/* UPLOAD DATE */}

                                            <span className="file-date">
                                                {formatDate(file.createdAt)}
                                            </span>


                                            {/* MORE OPTIONS */}

                                            <button
                                                className="file-more"
                                                aria-label={`More options for ${file.originalName}`}
                                            >

                                                <MoreHorizontal size={20} />

                                            </button>

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

export default Dashboard;
