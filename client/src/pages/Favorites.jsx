import React, { useState, useEffect } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../api/axios";

import {
    Star,
    Search,
    FileText,
    Image,
    FileSpreadsheet,
    FileArchive,
    File,
    Eye,
    Download,
    Trash2,
    RefreshCw,
    UploadCloud
} from "lucide-react";

import "./MyFiles.css";

function Favorites() {

    const [activeItem, setActiveItem] = useState("Favourites");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [accessingFileId, setAccessingFileId] = useState(null);
    const [removingFileId, setRemovingFileId] = useState(null);


    // --------------------------------
    // FETCH FAVOURITES
    // --------------------------------

    const fetchFavorites = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/favorites");

            setFavorites(
                (response.data.favorites || [])
                    .filter((favorite) => favorite.file)
            );

        } catch (error) {

            console.error("Error fetching favourites:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load your favourite files."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

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

        if (
            mimeType === "application/pdf" ||
            mimeType.includes("word") ||
            mimeType.includes("document")
        ) {
            return {
                icon: FileText,
                className: "pdf"
            };
        }

        return {
            icon: File,
            className: "default"
        };

    };


    // --------------------------------
    // SEARCH FAVOURITES
    // --------------------------------

    const filteredFavorites = favorites.filter((favorite) => {

        const file = favorite.file;

        return file.originalName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

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
    // REMOVE FROM FAVOURITES
    // --------------------------------

    const handleRemoveFavorite = async (fileId) => {

        try {

            setRemovingFileId(fileId);

            await api.delete(`/favorites/${fileId}`);

            setFavorites((prev) =>
                prev.filter(
                    (favorite) => favorite.file?._id !== fileId
                )
            );

            window.dispatchEvent(
                new Event("cloudspace-favorites-updated")
            );

        } catch (error) {

            console.error("Remove favourite error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to remove this file from favourites."
            );

        } finally {

            setRemovingFileId(null);

        }

    };


    // --------------------------------
    // PAGE UI
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

                            <h1>Favourites</h1>

                            <p>
                                Quickly access the files that matter most to you.
                            </p>

                        </div>

                        <button
                            className="myfiles-refresh"
                            onClick={fetchFavorites}
                            disabled={loading}
                        >
                            <RefreshCw size={17} />
                            Refresh
                        </button>

                    </section>


                    {/* STATISTICS */}

                    <section className="myfiles-stats">

                        <div className="myfiles-stat-card">

                            <Star size={22} />

                            <div>
                                <h3>{favorites.length}</h3>
                                <p>Favourite Files</p>
                            </div>

                        </div>

                    </section>


                    {/* SEARCH */}

                    <section className="myfiles-toolbar">

                        <div className="myfiles-search">

                            <Search size={19} />

                            <input
                                type="text"
                                placeholder="Search your favourites..."
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                            />

                        </div>

                    </section>


                    {/* FAVOURITES LIST */}

                    <section className="myfiles-table-section">

                        <div className="myfiles-table-heading">

                            <div>

                                <h2>Favourite Files</h2>

                                <p>
                                    {filteredFavorites.length} files found
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
                                    Loading your favourites...
                                </div>

                            )}


                            {/* ERROR */}

                            {!loading && error && (

                                <div className="myfiles-message error">

                                    {error}

                                    <button onClick={fetchFavorites}>
                                        Try Again
                                    </button>

                                </div>

                            )}


                            {/* EMPTY */}

                            {!loading && !error && filteredFavorites.length === 0 && (

                                <div className="myfiles-empty">

                                    <div className="myfiles-empty-icon">
                                        <Star size={32} />
                                    </div>

                                    <h3>
                                        {favorites.length === 0
                                            ? "No favourite files yet"
                                            : "No matching files found"}
                                    </h3>

                                    <p>
                                        {favorites.length === 0
                                            ? "Click the star icon beside any file to add it to your favourites."
                                            : "Try searching with a different file name."}
                                    </p>

                                </div>

                            )}


                            {/* FILE ROWS */}

                            {!loading && !error && filteredFavorites.map((favorite) => {

                                const file = favorite.file;

                                const {
                                    icon: Icon,
                                    className
                                } = getFileDetails(file.mimeType);

                                const isAccessing =
                                    accessingFileId === file._id;

                                const isRemoving =
                                    removingFileId === file._id;

                                return (

                                    <div
                                        className="myfiles-row"
                                        key={favorite._id}
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

                                            <button
                                                title="Remove from Favourites"
                                                className="favorite-file-btn active"
                                                disabled={isRemoving}
                                                onClick={() =>
                                                    handleRemoveFavorite(file._id)
                                                }
                                            >
                                                <Star
                                                    size={18}
                                                    fill="currentColor"
                                                />
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

export default Favorites;