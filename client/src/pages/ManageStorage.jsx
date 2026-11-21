import React, { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

import api from "../api/axios";

import {
    HardDrive,
    Image,
    Video,
    FileText,
    Music,
    File,
    RefreshCw,
    AlertCircle,
    Database,
    TrendingUp,
    FolderOpen
} from "lucide-react";

import "./ManageStorage.css";


function ManageStorage() {

    const [storage, setStorage] = useState(null);
    const [categories, setCategories] = useState(null);
    const [largestFiles, setLargestFiles] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    // ==========================================
    // FORMAT FILE SIZE
    // ==========================================

    const formatBytes = (bytes = 0) => {

        if (!bytes || bytes <= 0) return "0 Bytes";

        const units = ["Bytes", "KB", "MB", "GB", "TB"];

        const index = Math.min(
            Math.floor(Math.log(bytes) / Math.log(1024)),
            units.length - 1
        );

        return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
    };


    // ==========================================
    // FETCH STORAGE INFORMATION
    // ==========================================

    const fetchStorageData = async () => {

        try {

            setLoading(true);
            setError("");

            const response = await api.get("/files/storage");

            const data = response.data;

            if (data.success) {

                setStorage(data.storage);
                setCategories(data.categories);
                setLargestFiles(data.largestFiles || []);

            } else {

                setError(
                    data.message || "Unable to fetch storage information."
                );

            }

        } catch (error) {

            console.error("Storage Fetch Error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load storage information."
            );

        } finally {

            setLoading(false);

        }
    };


    // ==========================================
    // LOAD DATA WHEN PAGE OPENS
    // ==========================================

    useEffect(() => {

        fetchStorageData();

    }, []);


    // ==========================================
    // CATEGORY INFORMATION
    // ==========================================

    const categoryItems = [
        {
            name: "Images",
            value: categories?.images || 0,
            icon: Image,
            description: "Photos and image files"
        },
        {
            name: "Videos",
            value: categories?.videos || 0,
            icon: Video,
            description: "Video files"
        },
        {
            name: "Documents",
            value: categories?.documents || 0,
            icon: FileText,
            description: "Documents and text files"
        },
        {
            name: "Audio",
            value: categories?.audio || 0,
            icon: Music,
            description: "Music and audio files"
        },
        {
            name: "Others",
            value: categories?.others || 0,
            icon: File,
            description: "Other file formats"
        }
    ];


    // ==========================================
    // STORAGE USAGE PERCENTAGE
    // ==========================================

    const usagePercentage = storage
        ? Math.min(storage.usagePercentage || 0, 100)
        : 0;


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="app-layout">

            <Sidebar activeItem="Manage Storage" />

            <main className="main-content">

                <Navbar activeItem="Manage Storage" />

                <div className="manage-storage-content">


                    {/* ==================================
                        PAGE HEADER
                    ================================== */}

                    <div className="storage-page-header">

                        <div>

                            <h1>Manage Storage</h1>

                            <p>
                                Monitor your cloud storage usage and manage your files.
                            </p>

                        </div>

                        <button
                            className="storage-refresh-btn"
                            onClick={fetchStorageData}
                            disabled={loading}
                        >

                            <RefreshCw
                                size={17}
                                className={loading ? "storage-spinning" : ""}
                            />

                            Refresh

                        </button>

                    </div>


                    {/* ==================================
                        LOADING STATE
                    ================================== */}

                    {loading && (

                        <div className="storage-loading">

                            <RefreshCw className="storage-loading-icon" />

                            <p>Loading storage information...</p>

                        </div>

                    )}


                    {/* ==================================
                        ERROR STATE
                    ================================== */}

                    {!loading && error && (

                        <div className="storage-error">

                            <AlertCircle size={20} />

                            <span>{error}</span>

                            <button onClick={fetchStorageData}>
                                Try Again
                            </button>

                        </div>

                    )}


                    {/* ==================================
                        STORAGE CONTENT
                    ================================== */}

                    {!loading && storage && (

                        <>


                            {/* ==================================
                                STORAGE OVERVIEW
                            ================================== */}

                            <section className="storage-overview-section">

                                <div className="storage-section-title">

                                    <div className="storage-title-icon">
                                        <HardDrive size={21} />
                                    </div>

                                    <div>

                                        <h2>Storage Overview</h2>

                                        <p>
                                            Your CloudSpace storage at a glance.
                                        </p>

                                    </div>

                                </div>


                                {/* SUMMARY CARDS */}

                                <div className="storage-summary-grid">


                                    {/* USED STORAGE */}

                                    <div className="storage-summary-card">

                                        <div className="summary-card-icon used-icon">
                                            <Database size={20} />
                                        </div>

                                        <div>

                                            <span>Used Storage</span>

                                            <h3>
                                                {formatBytes(storage.usedStorage)}
                                            </h3>

                                        </div>

                                    </div>


                                    {/* TOTAL STORAGE */}

                                    <div className="storage-summary-card">

                                        <div className="summary-card-icon total-icon">
                                            <HardDrive size={20} />
                                        </div>

                                        <div>

                                            <span>Total Storage</span>

                                            <h3>
                                                {formatBytes(storage.totalStorage)}
                                            </h3>

                                        </div>

                                    </div>


                                    {/* AVAILABLE STORAGE */}

                                    <div className="storage-summary-card">

                                        <div className="summary-card-icon available-icon">
                                            <TrendingUp size={20} />
                                        </div>

                                        <div>

                                            <span>Available Storage</span>

                                            <h3>
                                                {formatBytes(storage.availableStorage)}
                                            </h3>

                                        </div>

                                    </div>

                                </div>


                                {/* STORAGE USAGE BAR */}

                                <div className="storage-usage-card">

                                    <div className="storage-usage-header">

                                        <div>

                                            <h3>Storage Usage</h3>

                                            <p>
                                                {formatBytes(storage.usedStorage)} used out of{" "}
                                                {formatBytes(storage.totalStorage)}
                                            </p>

                                        </div>

                                        <span className="storage-usage-percentage">
                                            {usagePercentage.toFixed(2)}%
                                        </span>

                                    </div>


                                    <div className="storage-progress-track">

                                        <div
                                            className="storage-progress-fill"
                                            style={{
                                                width: `${usagePercentage}%`
                                            }}
                                        />

                                    </div>


                                    <div className="storage-progress-labels">

                                        <span>
                                            {usagePercentage.toFixed(2)}% used
                                        </span>

                                        <span>
                                            {formatBytes(storage.availableStorage)} remaining
                                        </span>

                                    </div>

                                </div>

                            </section>


                            {/* ==================================
                                STORAGE BREAKDOWN
                            ================================== */}

                            <section className="storage-section">

                                <div className="storage-section-heading">

                                    <div>

                                        <h2>Storage Breakdown</h2>

                                        <p>
                                            See how your storage is distributed across file types.
                                        </p>

                                    </div>

                                </div>


                                <div className="storage-category-grid">

                                    {categoryItems.map((item) => {

                                        const Icon = item.icon;

                                        const percentage =
                                            storage.usedStorage > 0
                                                ? (item.value / storage.usedStorage) * 100
                                                : 0;


                                        return (

                                            <div
                                                className="storage-category-card"
                                                key={item.name}
                                            >

                                                {/* CARD TOP */}

                                                <div className="category-card-top">

                                                    <div className="category-icon">
                                                        <Icon size={21} />
                                                    </div>

                                                    <span>
                                                        {percentage.toFixed(1)}%
                                                    </span>

                                                </div>


                                                {/* CATEGORY NAME */}

                                                <h3>
                                                    {item.name}
                                                </h3>


                                                {/* DESCRIPTION */}

                                                <p>
                                                    {item.description}
                                                </p>


                                                {/* FILE SIZE */}

                                                <strong>
                                                    {formatBytes(item.value)}
                                                </strong>


                                                {/* PROGRESS BAR */}

                                                <div className="category-progress-track">

                                                    <div
                                                        className="category-progress-fill"
                                                        style={{
                                                            width: `${Math.min(percentage, 100)}%`
                                                        }}
                                                    />

                                                </div>

                                            </div>

                                        );

                                    })}

                                </div>

                            </section>


                            {/* ==================================
                                LARGEST FILES
                            ================================== */}

                            <section className="storage-section">

                                <div className="storage-section-heading">

                                    <div>

                                        <h2>Largest Files</h2>

                                        <p>
                                            Files taking up the most storage space.
                                        </p>

                                    </div>

                                    <FolderOpen
                                        size={21}
                                        className="storage-section-icon"
                                    />

                                </div>


                                <div className="largest-files-card">

                                    {largestFiles.length > 0 ? (

                                        <>

                                            <div className="largest-files-header">

                                                <span>FILE NAME</span>

                                                <span>FILE TYPE</span>

                                                <span>FILE SIZE</span>

                                            </div>


                                            {largestFiles.map((file, index) => (

                                                <div
                                                    className="largest-file-item"
                                                    key={file._id || index}
                                                >

                                                    <div className="largest-file-name">

                                                        <div className="largest-file-icon">
                                                            <File size={19} />
                                                        </div>

                                                        <div>

                                                            <h4 title={file.originalName}>
                                                                {file.originalName}
                                                            </h4>

                                                            <span>
                                                                Uploaded file
                                                            </span>

                                                        </div>

                                                    </div>


                                                    <div className="largest-file-type">
                                                        {file.mimeType || "Unknown"}
                                                    </div>


                                                    <div className="largest-file-size">
                                                        {formatBytes(file.size)}
                                                    </div>

                                                </div>

                                            ))}

                                        </>

                                    ) : (

                                        <div className="storage-empty-state">

                                            <File size={35} />

                                            <h3>No files uploaded yet</h3>

                                            <p>
                                                Your uploaded files will appear here.
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </section>

                        </>

                    )}

                </div>

            </main>

        </div>

    );

}

export default ManageStorage;