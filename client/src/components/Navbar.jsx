import React from "react";

import {
  Search,
  Bell,
  Menu,
  ChevronDown
} from "lucide-react";

function Navbar({ activeItem, onMenuClick }) {

  return (

    <header className="navbar">

      <div className="navbar-left">

        <button
          className="menu-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={23} />
        </button>

        <div className="page-heading">
          <h2>{activeItem}</h2>
          <p>Manage your files and documents</p>
        </div>

      </div>

      <div className="navbar-right">

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search your files..."
            aria-label="Search files"
          />

          <span className="search-shortcut">⌘ K</span>

        </div>

        <button
          className="notification-btn"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="navbar-profile">

          <div className="profile-avatar">
            SK
          </div>

          <div className="profile-details">
            <h4>Suraj Kumar</h4>
            <p>Free Plan</p>
          </div>

          <ChevronDown size={16} />

        </div>

      </div>

    </header>

  );
}

export default Navbar;