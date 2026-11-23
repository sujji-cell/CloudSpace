
import React, { useEffect, useState } from "react";

import {
    useParams,
    Link
} from "react-router-dom";

import {
    Cloud,
    FileText,
    Download,
    Eye,
    ShieldCheck,
    ShieldAlert,
    ArrowLeft,
    Loader,
    User,
    Calendar,
    HardDrive,
    Lock,
    Pencil
} from "lucide-react";

import api from "../api/axios";

import "./SharedFile.css";


function SharedFile() {

    const { fileId } = useParams();

    const [file, setFile] = useState(null);

    const [permission, setPermission] = useState("viewer");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [accessing, setAccessing] = useState(false);

    const [accessAction, setAccessAction] = useState("");


    // ============================================
    // GET OWNER FULL NAME
    // ============================================

    const getOwnerName = () => {

        const owner = file?.owner;

        if (!owner) {
            return "CloudSpace user";
        }

        const fullName = [
            owner.firstName,
            owner.middleName,
            owner.lastName
        ]
            .filter(Boolean)
            .join(" ");

        return fullName || owner.email || "CloudSpace user";

    };


    // ============================================
    // FORMAT FILE SIZE
    // ============================================

    const formatFileSize = (bytes) => {

        if (!bytes || bytes <= 0) {
            return "0 B";
        }

        const sizes = ["B", "KB", "MB", "GB", "TB"];

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


    // ============================================
    // FORMAT DATE
    // ============================================

    const formatDate = (date) => {

        if (!date) {
            return "N/A";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    };


    // ============================================
    // FETCH SHARED FILE DETAILS
    // ============================================

    useEffect(() => {

        let isMounted = true;

        const fetchSharedFile = async () => {

            try {

                setLoading(true);

                setError("");

                setFile(null);

                if (!fileId) {
                    throw new Error("Invalid file ID.");
                }

                // Get files shared with the logged-in user
                const response = await api.get("/shares/with-me");

                const shares = response.data.shares || [];

                // Find requested active share
                const matchingShare = shares.find(
                    (share) =>
                        share.file &&
                        share.file._id === fileId &&
                        share.isActive
                );

                if (!matchingShare) {

                    throw new Error(
                        "You don't have permission to access this file. The file may have been removed or the owner may have revoked your access."
                    );

                }

                if (!isMounted) {
                    return;
                }

                // Store file information
                setFile({

                    ...matchingShare.file,

                    owner: matchingShare.owner

                });

                // Store recipient permission
                setPermission(
                    matchingShare.permission || "viewer"
                );

            } catch (err) {

                console.error(
                    "Shared File Error:",
                    err
                );

                if (isMounted) {

                    setError(
                        err.response?.data?.message ||
                        err.message ||
                        "Unable to load this shared file."
                    );

                }

            } finally {

                if (isMounted) {
                    setLoading(false);
                }

            }

        };

        fetchSharedFile();

        return () => {
            isMounted = false;
        };

    }, [fileId]);


    // ============================================
    // GET AUTHORIZED FILE URL
    // ============================================

    const getAuthorizedFileUrl = async () => {

        if (!fileId) {
            throw new Error("Invalid file ID.");
        }

        const response = await api.get(
            `/files/${fileId}/access`
        );

        const accessUrl =
            response.data.url ||
            response.data.accessUrl ||
            response.data.fileUrl;

        if (!response.data.success || !accessUrl) {

            throw new Error(
                "Unable to access this file."
            );

        }

        return accessUrl;

    };


    // ============================================
    // PREVIEW FILE
    // ============================================

    const handlePreview = async () => {

        if (!file?._id) {

            alert("File information is unavailable.");

            return;

        }

        // Open blank tab immediately to avoid popup blocking
        const newWindow = window.open(
            "about:blank",
            "_blank"
        );

        if (!newWindow) {

            alert(
                "Please allow pop-ups to preview files."
            );

            return;

        }

        try {

            setAccessing(true);

            setAccessAction("preview");

            const accessUrl = await getAuthorizedFileUrl();

            newWindow.opener = null;

            newWindow.location.href = accessUrl;

        } catch (err) {

            console.error(
                "Preview Error:",
                err
            );

            newWindow.close();

            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to preview this file."
            );

        } finally {

            setAccessing(false);

            setAccessAction("");

        }

    };


    // ============================================
    // DOWNLOAD FILE
    // ============================================

    const handleDownload = async () => {

        if (!file?._id) {

            alert("File information is unavailable.");

            return;

        }

        try {

            setAccessing(true);

            setAccessAction("download");

            // Get temporary authorized URL
            const accessUrl = await getAuthorizedFileUrl();

            // Fetch actual file
            const response = await fetch(accessUrl);

            if (!response.ok) {

                throw new Error(
                    "Unable to download this file."
                );

            }

            // Convert response into Blob
            const blob = await response.blob();

            // Create temporary URL
            const downloadUrl = window.URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement("a");

            link.href = downloadUrl;

            link.download = file.originalName || "download";

            document.body.appendChild(link);

            link.click();

            link.remove();

            // Cleanup
            setTimeout(() => {

                window.URL.revokeObjectURL(downloadUrl);

            }, 1000);

        } catch (err) {

            console.error(
                "Download Error:",
                err
            );

            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to download this file."
            );

        } finally {

            setAccessing(false);

            setAccessAction("");

        }

    };


    // ============================================
    // LOADING SCREEN
    // ============================================

    if (loading) {

        return (

            <div className="shared-file-loading">

                <Loader
                    size={30}
                    className="shared-spinner"
                />

                <h3>
                    Checking file access...
                </h3>

                <p>
                    Please wait while CloudSpace verifies your permissions.
                </p>

            </div>

        );

    }


    // ============================================
    // ACCESS DENIED SCREEN
    // ============================================

    if (error || !file) {

        return (

            <div className="shared-file-page">

                <div className="shared-file-brand">

                    <Cloud size={25} />

                    <span>CloudSpace</span>

                </div>


                <div className="shared-file-error-card">

                    <ShieldAlert size={48} />

                    <h2>
                        Access Denied
                    </h2>

                    <p>
                        {error || "This file is unavailable."}
                    </p>

                    <Link
                        to="/shared-files"
                        className="shared-back-btn"
                    >

                        <ArrowLeft size={17} />

                        Back to Shared Files

                    </Link>

                </div>

            </div>

        );

    }


    // ============================================
    // MAIN PAGE
    // ============================================

    return (

        <div className="shared-file-page">


            {/* ================================= */}
            {/* BRAND */}
            {/* ================================= */}

            <div className="shared-file-brand">

                <Cloud size={25} />

                <span>CloudSpace</span>

            </div>


            {/* ================================= */}
            {/* MAIN CONTENT */}
            {/* ================================= */}

            <div className="shared-file-container">


                {/* PAGE HEADING */}

                <div className="shared-file-top">

                    <div>

                        <p className="shared-file-label">
                            SHARED WITH YOU
                        </p>

                        <h1>
                            Shared File
                        </h1>

                        <p>
                            A file has been shared with you through CloudSpace.
                        </p>

                    </div>

                    <ShieldCheck size={35} />

                </div>


                {/* ================================= */}
                {/* FILE CARD */}
                {/* ================================= */}

                <div className="shared-file-card">

                    <div className="shared-file-icon">

                        <FileText size={35} />

                    </div>


                    <div className="shared-file-details">

                        <h2>
                            {file.originalName || "Untitled file"}
                        </h2>

                        <p>
                            {file.format?.toUpperCase() || "FILE"}
                        </p>

                        <p>
                            Shared by {getOwnerName()}
                        </p>


                        {/* PERMISSION BADGE */}

                        <div
                            className={`shared-permission-badge ${
                                permission === "editor"
                                    ? "editor"
                                    : "viewer"
                            }`}
                        >

                            {permission === "editor" ? (

                                <>

                                    <Pencil size={14} />

                                    Editor Access

                                </>

                            ) : (

                                <>

                                    <Eye size={14} />

                                    Viewer Access

                                </>

                            )}

                        </div>

                    </div>

                </div>


                {/* ================================= */}
                {/* FILE INFORMATION */}
                {/* ================================= */}

                <div className="shared-file-information">

                    <div className="shared-info-item">

                        <HardDrive size={18} />

                        <div>

                            <span>File Size</span>

                            <strong>
                                {formatFileSize(file.size)}
                            </strong>

                        </div>

                    </div>


                    <div className="shared-info-item">

                        <Calendar size={18} />

                        <div>

                            <span>Uploaded</span>

                            <strong>
                                {formatDate(file.createdAt)}
                            </strong>

                        </div>

                    </div>


                    <div className="shared-info-item">

                        <User size={18} />

                        <div>

                            <span>Shared By</span>

                            <strong>
                                {getOwnerName()}
                            </strong>

                        </div>

                    </div>

                </div>


                {/* ================================= */}
                {/* ACTION BUTTONS */}
                {/* ================================= */}

                <div className="shared-file-actions">


                    {/* PREVIEW */}

                    <button
                        className="shared-preview-btn"
                        onClick={handlePreview}
                        disabled={accessing}
                    >

                        {accessing && accessAction === "preview" ? (

                            <Loader
                                size={19}
                                className="shared-spinner"
                            />

                        ) : (

                            <Eye size={19} />

                        )}

                        {accessing && accessAction === "preview"
                            ? "Opening..."
                            : "Preview File"}

                    </button>


                    {/* DOWNLOAD */}

                    <button
                        className="shared-download-btn"
                        onClick={handleDownload}
                        disabled={accessing}
                    >

                        {accessing && accessAction === "download" ? (

                            <Loader
                                size={19}
                                className="shared-spinner"
                            />

                        ) : (

                            <Download size={19} />

                        )}

                        {accessing && accessAction === "download"
                            ? "Downloading..."
                            : "Download File"}

                    </button>

                </div>


                {/* ================================= */}
                {/* PERMISSION INFORMATION */}
                {/* ================================= */}

                <div className="shared-permission-info">

                    <Lock size={19} />

                    <div>

                        <strong>
                            Your access permissions
                        </strong>

                        {permission === "editor" ? (

                            <p>
                                You can preview, download, and upload new versions
                                of this file. Only the owner can delete the file
                                or restore previous versions.
                            </p>

                        ) : (

                            <p>
                                You can preview and download this file.
                                Uploading new versions and modifying the file
                                are restricted to the owner and editors.
                            </p>

                        )}

                    </div>

                </div>


                {/* ================================= */}
                {/* SECURITY NOTICE */}
                {/* ================================= */}

                <div className="shared-security-notice">

                    <ShieldCheck size={20} />

                    <p>
                        This file is protected by CloudSpace access controls.
                        Only authorized users can access it.
                    </p>

                </div>


                {/* ================================= */}
                {/* BACK TO DASHBOARD */}
                {/* ================================= */}

                <Link
                    to="/shared-files"
                    className="shared-dashboard-link"
                >

                    <ArrowLeft size={16} />

                    Return to Shared Files

                </Link>

            </div>


            {/* ================================= */}
            {/* FOOTER */}
            {/* ================================= */}

            <footer className="shared-file-footer">

                CloudSpace © 2026 · Secure cloud storage and sharing

            </footer>

        </div>

    );

}

export default SharedFile;
