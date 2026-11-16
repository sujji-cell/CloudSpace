import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Share2,
  Clock3,
  Star,
  Settings,
  Cloud,
  LogOut,
  HardDrive,
  X
} from "lucide-react";

function Sidebar({ activeItem, setActiveItem, isOpen, onClose }) {

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard
    },
    {
      title: "My Files",
      icon: FolderOpen
    },
    {
      title: "Shared Files",
      icon: Share2
    },
    {
      title: "Recent",
      icon: Clock3
    },
    {
      title: "Favourites",
      icon: Star
    }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

        <div className="sidebar-header">

          <div className="brand">
            <div className="brand-icon">
              <Cloud size={23} />
            </div>

            <span>CloudSpace</span>
          </div>

          <button
            className="mobile-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>

        </div>

        <div className="sidebar-content">

          <p className="sidebar-label">WORKSPACE</p>

          <nav className="sidebar-menu">

            {menuItems.map((item) => {

              const Icon = item.icon;

              return (
                <button
                  key={item.title}
                  className={`sidebar-link ${
                    activeItem === item.title ? "active" : ""
                  }`}
                  onClick={() => {
                    setActiveItem(item.title);
                    onClose();
                  }}
                >

                  <Icon size={19} strokeWidth={1.8} />

                  <span>{item.title}</span>

                </button>
              );

            })}

          </nav>

          <div className="sidebar-bottom">

            <div className="storage-card">

              <div className="storage-heading">
                <HardDrive size={17} />
                <span>Storage</span>
              </div>

              <div className="storage-progress">
                <div className="storage-used"></div>
              </div>

              <p>2.4 GB of 10 GB used</p>

              <button className="upgrade-btn">
                Manage storage
              </button>

            </div>

            <button
              className="sidebar-link settings-link"
              onClick={() => {
                setActiveItem("Settings");
                onClose();
              }}
            >
              <Settings size={19} />
              <span>Settings</span>
            </button>

            <button className="sidebar-link">
              <LogOut size={19} />
              <span>Sign out</span>
            </button>

          </div>

        </div>

        <div className="sidebar-footer">
          <div className="user-avatar">SK</div>

          <div className="user-info">
            <h4>Suraj Kumar</h4>
            <p>Free Account</p>
          </div>

        </div>

      </aside>
    </>
  );
}

export default Sidebar;