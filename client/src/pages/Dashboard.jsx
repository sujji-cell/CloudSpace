import React, { useState } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

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


  const files = [
    {
      name: "Computer Networks Notes",
      type: "PDF Document",
      size: "2.4 MB",
      date: "Today, 10:30 AM",
      icon: FileText,
      className: "pdf"
    },
    {
      name: "Project Documentation",
      type: "Word Document",
      size: "1.8 MB",
      date: "Yesterday",
      icon: FileText,
      className: "doc"
    },
    {
      name: "Dashboard Design",
      type: "PNG Image",
      size: "3.2 MB",
      date: "Nov 15, 2026",
      icon: Image,
      className: "image"
    },
    {
      name: "Project Data",
      type: "Excel Spreadsheet",
      size: "850 KB",
      date: "Nov 14, 2026",
      icon: FileSpreadsheet,
      className: "excel"
    },
    {
      name: "Source Code",
      type: "ZIP Archive",
      size: "12 MB",
      date: "Nov 12, 2026",
      icon: FileArchive,
      className: "zip"
    }
  ];


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


        <div className="dashboard-content">

          {/* Welcome Section */}

          <section className="welcome-section">

            <div>
              <p className="welcome-date">YOUR WORKSPACE</p>

              <h1>Good morning, Suraj 👋</h1>

              <p className="welcome-description">
                Here's what's happening with your files today.
              </p>
            </div>

            <div className="welcome-actions">

              <button className="secondary-btn">
                <FolderPlus size={17} />
                New Folder
              </button>

              <button className="primary-btn">
                <Plus size={18} />
                Upload Files
              </button>

            </div>

          </section>


          {/* Statistics */}

          <section className="stats-grid">

            <div className="stat-card">

              <div className="stat-top">
                <span>Total Files</span>

                <div className="stat-icon purple">
                  <FileText size={20} />
                </div>
              </div>

              <h2>128</h2>

              <p>Files in your workspace</p>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <span>Storage Used</span>

                <div className="stat-icon blue">
                  <UploadCloud size={20} />
                </div>
              </div>

              <h2>2.4 GB</h2>

              <p>Of 10 GB available</p>

            </div>


            <div className="stat-card">

              <div className="stat-top">
                <span>Shared Files</span>

                <div className="stat-icon green">
                  <ArrowUpRight size={20} />
                </div>
              </div>

              <h2>24</h2>

              <p>Files shared with others</p>

            </div>


          </section>


          {/* Upload Section */}

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

            <button className="upload-action">
              Browse Files
            </button>

          </section>


          {/* Recent Files */}

          <section className="files-section">

            <div className="section-heading">

              <div>
                <h2>Recent Files</h2>
                <p>Your recently uploaded documents</p>
              </div>

              <button className="view-all-btn">
                View all
                <ArrowUpRight size={16} />
              </button>

            </div>


            <div className="files-table">

              <div className="files-table-header">

                <span>NAME</span>
                <span>FILE SIZE</span>
                <span>LAST MODIFIED</span>
                <span></span>

              </div>


              {files.map((file, index) => {

                const Icon = file.icon;

                return (

                  <div
                    className="file-row"
                    key={index}
                  >

                    <div className="file-name">

                      <div className={`file-icon ${file.className}`}>
                        <Icon size={21} />
                      </div>

                      <div>
                        <h4>{file.name}</h4>
                        <p>{file.type}</p>
                      </div>

                    </div>


                    <span className="file-size">
                      {file.size}
                    </span>


                    <span className="file-date">
                      {file.date}
                    </span>


                    <button
                      className="file-more"
                      aria-label={`More options for ${file.name}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>

                  </div>

                );

              })}

            </div>

          </section>

          <footer className="dashboard-footer">
            CloudSpace © 2026 · Secure file storage and sharing
          </footer>

        </div>

      </main>

    </div>

  );

}

export default Dashboard;