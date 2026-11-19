import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
    Cloud,
    FileText,
    Download,
    Eye,
    ShieldCheck,
    ShieldAlert,
    ArrowLeft,
    Loader
} from "lucide-react";

import api from "../api/axios";

import "./SharedFile.css";

function SharedFile() {

    const { fileId } = useParams();

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [accessing, setAccessing] = useState(false);

    // Fetch shared file details
    useEffect(() => {

        const fetchSharedFile = async () => {

            try {

                setLoading(true);
                setError("");

                // Get shared files accessible to the logged-in user
                const response = await api.get("/shares/with-me");

                const shares = response.data.shares || [];

                // Find the requested file among active shares
                const matchingShare = shares.find(
                    (share) =>
                        share.file &&
                        share.file._id === fileId &&
                        share.isActive
                );

                if (!matchingShare) {

                    setError(
                        "You don't have permission to access this file. Ask the owner to share it with your CloudSpace email."
                    );

                    return;

                }

                setFile({
                    ...matchingShare.file,
                    owner: matchingShare.owner
                });

            } catch (err) {

                console.error("Shared File Error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load this shared file."
                );

            } finally {

                setLoading(false);

            }

        };

        fetchSharedFile();

    }, [fileId]);


    // Get authorized file URL
    const getAuthorizedFileUrl = async () => {

        const response = await api.get(`/files/${fileId}/access`);

        if (!response.data.success || !response.data.accessUrl) {
            throw new Error("Unable to access this file.");
        }

        return response.data.accessUrl;

    };


    // Preview file
    const handlePreview = async () => {

        const newWindow = window.open("about:blank", "_blank");

        if (!newWindow) {
            alert("Please allow pop-ups to preview files.");
            return;
        }

        try {

            setAccessing(true);

            const accessUrl = await getAuthorizedFileUrl();

            newWindow.location.href = accessUrl;

        } catch (err) {

            console.error("Preview Error:", err);

            newWindow.close();

            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to preview file."
            );

        } finally {

            setAccessing(false);

        }

    };


    // Download file
    const handleDownload = async () => {

        try {

            setAccessing(true);

            const accessUrl = await getAuthorizedFileUrl();

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

        } catch (err) {

            console.error("Download Error:", err);

            alert(
                err.response?.data?.message ||
                err.message ||
                "Unable to download file."
            );

        } finally {

            setAccessing(false);

        }

    };


    if (loading) {

        return (

            <div className="shared-file-loading">

                <Loader size={30} className="shared-spinner" />

                <h3>Checking file access...</h3>

            </div>

        );

    }


    if (error) {

        return (

            <div className="shared-file-page">

                <div className="shared-file-brand">
                    <Cloud size={25} />
                    <span>CloudSpace</span>
                </div>

                <div className="shared-file-error-card">

                    <ShieldAlert size={48} />

                    <h2>Access Denied</h2>

                    <p>{error}</p>

                    <Link to="/" className="shared-back-btn">
                        <ArrowLeft size={17} />
                        Back to Dashboard
                    </Link>

                </div>

            </div>

        );

    }


    return (

        <div className="shared-file-page">

            {/* Brand */}

            <div className="shared-file-brand">

                <Cloud size={25} />

                <span>CloudSpace</span>

            </div>


            {/* Main Content */}

            <div className="shared-file-container">

                <div className="shared-file-top">

                    <div>

                        <p className="shared-file-label">
                            SHARED WITH YOU
                        </p>

                        <h1>Shared File</h1>

                        <p>
                            A file has been shared with you through CloudSpace.
                        </p>

                    </div>

                    <ShieldCheck size={35} />

                </div>


                {/* File Card */}

                <div className="shared-file-card">

                    <div className="shared-file-icon">
                        <FileText size={35} />
                    </div>

                    <div className="shared-file-details">

                        <h2>{file.originalName}</h2>

                        <p>
                            {file.format?.toUpperCase() || "FILE"}
                        </p>

                        <p>
                            Shared by{" "}
                            {file.owner?.firstName || "CloudSpace user"}
                        </p>

                    </div>

                </div>


                {/* Actions */}

                <div className="shared-file-actions">

                    <button
                        className="shared-preview-btn"
                        onClick={handlePreview}
                        disabled={accessing}
                    >
                        <Eye size={19} />
                        Preview File
                    </button>

                    <button
                        className="shared-download-btn"
                        onClick={handleDownload}
                        disabled={accessing}
                    >
                        <Download size={19} />
                        Download File
                    </button>

                </div>


                {/* Security Notice */}

                <div className="shared-security-notice">

                    <ShieldCheck size={20} />

                    <p>
                        This file is protected by CloudSpace access controls.
                        Only authorized users can access it.
                    </p>

                </div>


                <Link to="/" className="shared-dashboard-link">
                    <ArrowLeft size={16} />
                    Return to Dashboard
                </Link>

            </div>


            <footer className="shared-file-footer">
                CloudSpace © 2026 · Secure cloud storage and sharing
            </footer>

        </div>

    );

}

export default SharedFile;