import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

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
    Star,
    Folder,
    FolderPlus,
    ArrowLeft,
    Pencil,
    FolderOpen,
    MoveRight
} from "lucide-react";

import "./MyFiles.css";

function MyFiles() {
    // --------------------------------
    // URL SEARCH PARAMS
    // --------------------------------

    const [searchParams, setSearchParams] = useSearchParams();

    // Restore the folder ID from the URL when the page loads.
    const [currentFolderId, setCurrentFolderId] = useState(
        () => searchParams.get("folder")
    );

    const [activeItem, setActiveItem] = useState("My Files");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [files, setFiles] = useState([]);

    // Folder states
    const [folders, setFolders] = useState([]);
    const [folderLoading, setFolderLoading] = useState(false);

    const [showFolderModal, setShowFolderModal] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [folderAction, setFolderAction] = useState("create");
    const [editingFolderId, setEditingFolderId] = useState(null);
    const [folderSaving, setFolderSaving] = useState(false);
    const [folderError, setFolderError] = useState("");

    const [folderDeleteId, setFolderDeleteId] = useState(null);
    const [folderDeleting, setFolderDeleting] = useState(false);

    // Move file states
    const [moveFileItem, setMoveFileItem] = useState(null);
    const [destinationFolderId, setDestinationFolderId] = useState("");
    const [moving, setMoving] = useState(false);
    const [moveError, setMoveError] = useState("");

    // File states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("All Files");
    const [sortOrder, setSortOrder] = useState("newest");

    // Favourite states
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [favoriteUpdatingId, setFavoriteUpdatingId] = useState(null);

    // Delete file states
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

    // File upload states
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");

    // --------------------------------
    // FETCH USER FILES
    // --------------------------------

    const fetchFiles = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/files", {
                params: currentFolderId
                    ? { folderId: currentFolderId }
                    : { root: "true" }
            });

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
    // FETCH USER FOLDERS
    // --------------------------------

    const fetchFolders = async () => {
        try {
            setFolderLoading(true);

            const response = await api.get("/folders");

            setFolders(response.data.folders || []);

        } catch (error) {
            console.error("Error fetching folders:", error);

            alert(
                error.response?.data?.message ||
                "Unable to load folders."
            );

        } finally {
            setFolderLoading(false);
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
    // CREATE / RENAME FOLDER MODAL
    // --------------------------------

    const openFolderModal = (action, folder = null) => {
        setFolderAction(action);
        setFolderError("");

        if (action === "rename" && folder) {
            setEditingFolderId(folder._id);
            setFolderName(folder.name);
        } else {
            setEditingFolderId(null);
            setFolderName("");
        }

        setShowFolderModal(true);
    };

    const closeFolderModal = () => {
        if (folderSaving) return;

        setShowFolderModal(false);
        setFolderName("");
        setEditingFolderId(null);
        setFolderError("");
    };

    // --------------------------------
    // CREATE / RENAME FOLDER
    // --------------------------------

    const handleFolderSubmit = async (e) => {
        e.preventDefault();

        const trimmedName = folderName.trim();

        if (!trimmedName) {
            setFolderError("Please enter a folder name.");
            return;
        }

        try {
            setFolderSaving(true);
            setFolderError("");

            if (folderAction === "create") {
                await api.post("/folders", {
                    name: trimmedName,
                    parentFolder: currentFolderId || null
                });
            } else {
                await api.put(`/folders/${editingFolderId}`, {
                    name: trimmedName
                });
            }

            await fetchFolders();

            closeFolderModal();

        } catch (error) {
            console.error("Folder operation error:", error);

            setFolderError(
                error.response?.data?.message ||
                "Unable to save folder."
            );

        } finally {
            setFolderSaving(false);
        }
    };

    // --------------------------------
    // DELETE FOLDER
    // --------------------------------

    const handleDeleteFolder = async () => {
        if (!folderDeleteId) return;

        try {
            setFolderDeleting(true);

            await api.delete(`/folders/${folderDeleteId}`);

            setFolders((prev) =>
                prev.filter((folder) => folder._id !== folderDeleteId)
            );

            setFolderDeleteId(null);

        } catch (error) {
            console.error("Delete folder error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to delete folder."
            );

        } finally {
            setFolderDeleting(false);
        }
    };

    // --------------------------------
    // GET FOLDERS IN CURRENT LOCATION
    // --------------------------------

    const currentFolders = folders.filter((folder) => {
        const parentId =
            folder.parentFolder?._id ||
            folder.parentFolder ||
            null;

        return String(parentId || "") === String(currentFolderId || "");
    });

    // --------------------------------
    // GET CURRENT FOLDER
    // --------------------------------

    const currentFolder = folders.find(
        (folder) =>
            String(folder._id) === String(currentFolderId)
    );

    // --------------------------------
    // BUILD FOLDER BREADCRUMB
    // --------------------------------

    const getFolderPath = () => {
        const path = [];
        let folder = currentFolder;

        const visited = new Set();

        while (folder && !visited.has(String(folder._id))) {
            visited.add(String(folder._id));

            path.unshift(folder);

            const parentId =
                folder.parentFolder?._id ||
                folder.parentFolder ||
                null;

            if (!parentId) break;

            folder = folders.find(
                (item) =>
                    String(item._id) === String(parentId)
            );
        }

        return path;
    };

    const folderPath = getFolderPath();

    // --------------------------------
    // NAVIGATE TO FOLDER
    // --------------------------------

    const navigateToFolder = (folderId) => {
        const nextFolderId = folderId || null;

        // Update the URL so the folder can be restored after refresh.
        if (nextFolderId) {
            setSearchParams({ folder: nextFolderId });
        } else {
            // Remove the folder query parameter when returning to root.
            setSearchParams({});
        }

        setCurrentFolderId(nextFolderId);

        setSearchQuery("");
        setSelectedType("All Files");
    };

    // --------------------------------
    // SYNC FOLDER WITH BROWSER URL
    // --------------------------------

    useEffect(() => {
        const folderIdFromUrl = searchParams.get("folder");

        setCurrentFolderId((previousFolderId) => {
            if (previousFolderId === folderIdFromUrl) {
                return previousFolderId;
            }

            return folderIdFromUrl;
        });
    }, [searchParams]);

    // --------------------------------
    // NAVIGATE TO PARENT FOLDER
    // --------------------------------

    const goBackToParent = () => {
        if (!currentFolder) {
            navigateToFolder(null);
            return;
        }

        const parentId =
            currentFolder.parentFolder?._id ||
            currentFolder.parentFolder ||
            null;

        navigateToFolder(parentId);
    };

    // --------------------------------
    // NAVIGATE TO ROOT
    // --------------------------------

    const goBackToRoot = () => {
        navigateToFolder(null);
    };

    // --------------------------------
    // OPEN MOVE FILE MODAL
    // --------------------------------

    const openMoveModal = (file) => {
        setMoveFileItem(file);
        setDestinationFolderId("");
        setMoveError("");
    };

    // --------------------------------
    // CLOSE MOVE FILE MODAL
    // --------------------------------

    const closeMoveModal = () => {
        if (moving) return;

        setMoveFileItem(null);
        setDestinationFolderId("");
        setMoveError("");
    };

    // --------------------------------
    // MOVE FILE TO SELECTED FOLDER
    // --------------------------------

    const handleMoveFile = async () => {
        if (!moveFileItem) return;

        const currentFileFolderId =
            moveFileItem.folder?._id ||
            moveFileItem.folder ||
            null;

        const newFolderId = destinationFolderId || null;

        if (
            String(currentFileFolderId || "") ===
            String(newFolderId || "")
        ) {
            setMoveError("This file is already in the selected location.");
            return;
        }

        try {
            setMoving(true);
            setMoveError("");

            const response = await api.put(
                `/files/${moveFileItem._id}/move`,
                {
                    folderId: newFolderId
                }
            );

            setFiles((prevFiles) =>
                prevFiles.filter(
                    (file) => file._id !== moveFileItem._id
                )
            );

            window.dispatchEvent(
                new Event("cloudspace-files-updated")
            );

            setMoveFileItem(null);
            setDestinationFolderId("");
            setMoveError("");

            alert(
                response.data.message ||
                "File moved successfully!"
            );

        } catch (error) {
            console.error("Move file error:", error);

            setMoveError(
                error.response?.data?.message ||
                "Unable to move file. Please try again."
            );

        } finally {
            setMoving(false);
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
    // OPEN FILE PICKER
    // --------------------------------

    const openFilePicker = () => {
        if (uploading) return;

        setUploadError("");

        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // --------------------------------
    // UPLOAD FILES INTO CURRENT FOLDER
    // --------------------------------

    const handleFileUpload = async (e) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (selectedFiles.length === 0) {
            return;
        }

        try {
            setUploading(true);
            setUploadError("");

            for (const file of selectedFiles) {
                const formData = new FormData();

                formData.append("file", file);

                if (currentFolderId) {
                    formData.append("folderId", currentFolderId);
                }

                await api.post("/files/upload", formData);
            }

            await fetchFiles();

            window.dispatchEvent(
                new Event("cloudspace-files-updated")
            );

        } catch (error) {
            console.error("File upload error:", error);

            setUploadError(
                error.response?.data?.message ||
                "Unable to upload files. Please try again."
            );

        } finally {
            setUploading(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // --------------------------------
    // INITIAL DATA FETCH
    // --------------------------------

    useEffect(() => {
        fetchFiles();
    }, [currentFolderId]);

    useEffect(() => {
        fetchFolders();
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

            setFavoriteIds((prev) =>
                prev.filter((id) => id !== deleteFileId)
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

                            <h1>My Files</h1>

                            <p>
                                Manage, organize and access all your uploaded files.
                            </p>
                        </div>

                        <div className="myfiles-heading-actions">

                            <button
                                type="button"
                                className="upload-files-btn"
                                onClick={openFilePicker}
                                disabled={uploading}
                            >
                                <UploadCloud size={17} />

                                {uploading ? "Uploading..." : "Upload Files"}
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                multiple
                                style={{ display: "none" }}
                                onChange={handleFileUpload}
                            />

                            <button
                                type="button"
                                className="create-folder-btn"
                                onClick={() => openFolderModal("create")}
                            >
                                <FolderPlus size={17} />
                                Create Folder
                            </button>

                            <button
                                type="button"
                                className="myfiles-refresh"
                                onClick={() => {
                                    fetchFiles();
                                    fetchFolders();
                                    fetchFavorites();
                                }}
                                disabled={loading || folderLoading || uploading}
                            >
                                <RefreshCw size={17} />
                                Refresh
                            </button>

                        </div>

                    </section>

                    {/* UPLOAD ERROR */}

                    {uploadError && (
                        <div className="upload-error-message">
                            {uploadError}
                        </div>
                    )}

                    {/* FOLDER BREADCRUMB */}

                    <section className="folder-navigation">

                        <div className="folder-breadcrumb">

                            <button
                                className={!currentFolderId ? "breadcrumb-active" : ""}
                                onClick={goBackToRoot}
                            >
                                <Folder size={16} />
                                My Files
                            </button>

                            {folderPath.map((folder) => (
                                <React.Fragment key={folder._id}>

                                    <span className="breadcrumb-separator">
                                        /
                                    </span>

                                    <button
                                        className={
                                            String(currentFolderId) === String(folder._id)
                                                ? "breadcrumb-active"
                                                : ""
                                        }
                                        onClick={() =>
                                            navigateToFolder(folder._id)
                                        }
                                    >
                                        {folder.name}
                                    </button>

                                </React.Fragment>
                            ))}

                        </div>

                        {currentFolderId && (
                            <button
                                className="back-folder-btn"
                                onClick={goBackToParent}
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>
                        )}

                    </section>

                    {/* FILE STATISTICS */}

                    <section className="myfiles-stats">

                        <div className="myfiles-stat-card">
                            <FileText size={22} />

                            <div>
                                <h3>{files.length}</h3>
                                <p>Files in Current Location</p>
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

                                <p>Storage Used in Current Location</p>
                            </div>
                        </div>

                    </section>

                    {/* FOLDERS SECTION */}

                    <section className="folders-section">

                        <div className="folders-section-heading">

                            <div>
                                <h2>
                                    <FolderOpen size={19} />
                                    Folders
                                </h2>

                                <p>{currentFolders.length} folders</p>
                            </div>

                        </div>

                        {folderLoading ? (

                            <div className="folder-empty-message">
                                Loading folders...
                            </div>

                        ) : currentFolders.length === 0 ? (

                            <div className="folder-empty-message">
                                No folders here. Create a folder to organize your files.
                            </div>

                        ) : (

                            <div className="folder-grid">

                                {currentFolders.map((folder) => (

                                    <div className="folder-card" key={folder._id}>

                                        <button
                                            className="folder-card-main"
                                            onClick={() =>
                                                navigateToFolder(folder._id)
                                            }
                                        >
                                            <div className="folder-card-icon">
                                                <Folder size={27} />
                                            </div>

                                            <div className="folder-card-info">
                                                <h3>{folder.name}</h3>
                                                <p>Open folder</p>
                                            </div>
                                        </button>

                                        <div className="folder-card-actions">

                                            <button
                                                title="Rename folder"
                                                onClick={() =>
                                                    openFolderModal("rename", folder)
                                                }
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                title="Delete folder"
                                                className="folder-delete-btn"
                                                onClick={() =>
                                                    setFolderDeleteId(folder._id)
                                                }
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        )}

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
                                <h2>
                                    {currentFolder
                                        ? `Files in ${currentFolder.name}`
                                        : "Files in My Files"}
                                </h2>

                                <p>{filteredFiles.length} files found</p>
                            </div>

                        </div>

                        <div className="myfiles-table">

                            <div className="myfiles-table-header">
                                <span>FILE NAME</span>
                                <span>FILE SIZE</span>
                                <span>DATE UPLOADED</span>
                                <span>ACTIONS</span>
                            </div>

                            {loading && (
                                <div className="myfiles-message">
                                    Loading your files...
                                </div>
                            )}

                            {!loading && error && (
                                <div className="myfiles-message error">
                                    {error}

                                    <button onClick={fetchFiles}>
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {!loading && !error && filteredFiles.length === 0 && (
                                <div className="myfiles-empty">

                                    <div className="myfiles-empty-icon">
                                        <UploadCloud size={32} />
                                    </div>

                                    <h3>No files found</h3>

                                    <p>
                                        Upload files or try changing your search or filter.
                                    </p>

                                </div>
                            )}

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
                                            {formatDate(file.createdAt)}
                                        </span>

                                        <div className="myfiles-actions">

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

                                            <button
                                                title="Move file"
                                                onClick={() => openMoveModal(file)}
                                            >
                                                <MoveRight size={18} />
                                            </button>

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
                                                title="Share"
                                                className="share-file-btn"
                                                onClick={() => openShareModal(file)}
                                            >
                                                <Share2 size={18} />
                                            </button>

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

                    {/* MOVE FILE MODAL */}

                    {moveFileItem && (
                        <div
                            className="folder-modal-overlay"
                            onClick={closeMoveModal}
                        >

                            <div
                                className="folder-modal move-file-modal"
                                onClick={(e) => e.stopPropagation()}
                            >

                                <button
                                    className="folder-modal-close"
                                    onClick={closeMoveModal}
                                    disabled={moving}
                                >
                                    <X size={20} />
                                </button>

                                <div className="folder-modal-icon">
                                    <MoveRight size={25} />
                                </div>

                                <h2>Move File</h2>

                                <p>
                                    Select where you want to move this file.
                                </p>

                                <div className="share-file-info">
                                    <FileText size={19} />
                                    <span>{moveFileItem.originalName}</span>
                                </div>

                                <label htmlFor="destinationFolder">
                                    Destination
                                </label>

                                <select
                                    id="destinationFolder"
                                    className="move-folder-select"
                                    value={destinationFolderId}
                                    onChange={(e) => {
                                        setDestinationFolderId(e.target.value);
                                        setMoveError("");
                                    }}
                                    disabled={moving}
                                >
                                    <option value="">
                                        My Files (Root)
                                    </option>

                                    {folders.map((folder) => {

                                        const folderPath = [];

                                        let parent = folder;
                                        const visited = new Set();

                                        while (
                                            parent &&
                                            !visited.has(String(parent._id))
                                        ) {
                                            visited.add(String(parent._id));
                                            folderPath.unshift(parent.name);

                                            const nextParentId =
                                                parent.parentFolder?._id ||
                                                parent.parentFolder ||
                                                null;

                                            parent = nextParentId
                                                ? folders.find(
                                                    (item) =>
                                                        String(item._id) ===
                                                        String(nextParentId)
                                                )
                                                : null;
                                        }

                                        const fileFolderId =
                                            moveFileItem.folder?._id ||
                                            moveFileItem.folder ||
                                            null;

                                        const isCurrentLocation =
                                            String(fileFolderId || "") ===
                                            String(folder._id);

                                        return (
                                            <option
                                                key={folder._id}
                                                value={folder._id}
                                                disabled={isCurrentLocation}
                                            >
                                                {folderPath.join(" / ")}
                                                {isCurrentLocation
                                                    ? " (Current location)"
                                                    : ""}
                                            </option>
                                        );
                                    })}

                                </select>

                                {moveError && (
                                    <p className="folder-error">
                                        {moveError}
                                    </p>
                                )}

                                <div className="folder-modal-actions">

                                    <button
                                        type="button"
                                        onClick={closeMoveModal}
                                        disabled={moving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleMoveFile}
                                        disabled={moving}
                                    >
                                        {moving ? "Moving..." : "Move File"}
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                    {/* CREATE / RENAME FOLDER MODAL */}

                    {showFolderModal && (
                        <div
                            className="folder-modal-overlay"
                            onClick={closeFolderModal}
                        >

                            <div
                                className="folder-modal"
                                onClick={(e) => e.stopPropagation()}
                            >

                                <button
                                    className="folder-modal-close"
                                    onClick={closeFolderModal}
                                    disabled={folderSaving}
                                >
                                    <X size={20} />
                                </button>

                                <div className="folder-modal-icon">
                                    <FolderPlus size={25} />
                                </div>

                                <h2>
                                    {folderAction === "create"
                                        ? "Create New Folder"
                                        : "Rename Folder"}
                                </h2>

                                <p>
                                    {folderAction === "create"
                                        ? "Create a folder to organize your files."
                                        : "Enter a new name for this folder."}
                                </p>

                                <form onSubmit={handleFolderSubmit}>

                                    <label htmlFor="folderName">
                                        Folder Name
                                    </label>

                                    <input
                                        id="folderName"
                                        type="text"
                                        placeholder="Enter folder name"
                                        value={folderName}
                                        onChange={(e) => {
                                            setFolderName(e.target.value);
                                            setFolderError("");
                                        }}
                                        maxLength={100}
                                        autoFocus
                                        required
                                    />

                                    {folderError && (
                                        <p className="folder-error">
                                            {folderError}
                                        </p>
                                    )}

                                    <div className="folder-modal-actions">

                                        <button
                                            type="button"
                                            onClick={closeFolderModal}
                                            disabled={folderSaving}
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={folderSaving}
                                        >
                                            {folderSaving
                                                ? "Saving..."
                                                : folderAction === "create"
                                                    ? "Create Folder"
                                                    : "Save Changes"}
                                        </button>

                                    </div>

                                </form>

                            </div>

                        </div>
                    )}

                    {/* DELETE FOLDER CONFIRMATION */}

                    {folderDeleteId && (
                        <div className="folder-modal-overlay">

                            <div className="folder-modal">

                                <div className="folder-modal-icon folder-warning-icon">
                                    <AlertTriangle size={25} />
                                </div>

                                <h2>Delete this folder?</h2>

                                <p>
                                    You can only delete an empty folder.
                                    Files and subfolders must be moved or deleted first.
                                </p>

                                <div className="folder-modal-actions">

                                    <button
                                        onClick={() => setFolderDeleteId(null)}
                                        disabled={folderDeleting}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        className="folder-confirm-delete"
                                        onClick={handleDeleteFolder}
                                        disabled={folderDeleting}
                                    >
                                        {folderDeleting
                                            ? "Deleting..."
                                            : "Delete Folder"}
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

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

                    {/* DELETE FILE MODAL */}

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

                    <footer className="dashboard-footer">
                        CloudSpace © 2026 · Secure file storage and sharing
                    </footer>

                </div>

            </main>

        </div>
    );
}

export default MyFiles;