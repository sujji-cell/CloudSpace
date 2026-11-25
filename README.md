# ☁️ CloudSpace

### A Secure, Full-Stack Cloud File Storage and Sharing Platform

<p align="center">
  <img src="client/public/cloudspace-wordmark-dark.png" alt="CloudSpace Logo" width="350" />
</p>

<p align="center">
  <strong>Store. Organize. Share. Secure.</strong>
</p>

---

## 📌 Overview

**CloudSpace** is a full-stack cloud file storage and sharing application designed to provide users with a secure and convenient way to upload, manage, organize, and share their files.

Built using the MERN stack, CloudSpace combines a responsive React interface with a Node.js and Express backend, MongoDB database management, and Cloudinary cloud storage.

The platform includes secure authentication, email verification, two-factor authentication, file version management, folder organization, file sharing with permission controls, session management, and security notifications.

CloudSpace aims to provide a reliable and user-friendly cloud storage experience with an emphasis on data security, accessibility, and efficient file management.

---

## ✨ Key Features

### 🔐 Authentication and Security
- User registration and login.
- Email verification using OTP.
- Secure password hashing with bcrypt.
- JWT-based authentication using HTTP-only cookies.
- Two-factor authentication through email OTP.
- Password change and profile management.
- Temporary account lockout after repeated failed login attempts.
- Login activity tracking and suspicious login notifications.

### 📁 File Management
- Upload files to cloud storage.
- View and manage uploaded files.
- Secure file access through authenticated delivery.
- Download and preview supported files.
- Move files between folders.
- Delete files and manage storage usage.
- Recently accessed files.

### 📂 Folder Management
- Create and manage folders.
- Organize files into folders.
- Update folder details.
- Delete folders.

### 🤝 File Sharing
- Share files with other registered users.
- Share files using recipient email addresses.
- Assign Viewer or Editor permissions.
- View files shared with you.
- Manage files shared by you.
- Revoke file-sharing access.

### 🕘 File Version Management
- Maintain file version history.
- Upload new versions of existing files.
- View previous versions.
- Restore an earlier file version.

### ⭐ Favorites and Recycle Bin
- Add files to favorites.
- Remove files from favorites.
- Move deleted files to the recycle bin.
- Restore deleted files.
- Permanently delete files.

### 🔔 Notifications and Account Management
- In-app notifications.
- Email notifications for supported security events.
- Manage notification preferences.
- Manage appearance preferences.
- View active login sessions.
- View login history.
- Revoke individual sessions or other active sessions.

### 📊 Storage Management
- View storage usage.
- Monitor uploaded file storage.
- Manage available storage through the storage dashboard.

---

## 🛠️ Technology Stack

CloudSpace uses the MERN stack along with additional tools and services.

### Frontend

| Technology | Purpose |
|---|---|
| React.js | Building the user interface |
| Vite | Frontend development server and build tool |
| React Router DOM | Client-side navigation and routing |
| Axios | Communication with backend APIs |
| CSS3 | Styling and responsive layouts |
| Lucide React | Interface icons |
| React Icons | Additional icon resources |
| Oxlint | Code linting |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend server and REST API development |
| MongoDB | Database for application data |
| Mongoose | MongoDB object modeling |
| JSON Web Token (JWT) | Authentication |
| bcryptjs | Password hashing |
| Cookie Parser | Reading authentication cookies |
| Multer | Handling file uploads |
| Nodemailer | Sending email notifications and OTPs |
| CORS | Managing cross-origin requests |
| dotenv | Environment variable configuration |

### Cloud Services

| Technology | Purpose |
|---|---|
| Cloudinary | Cloud-based file storage and delivery |
| MongoDB Atlas | Cloud-hosted MongoDB database |
| Gmail SMTP | Email delivery through Nodemailer |

---

## 🏗️ Project Architecture

CloudSpace follows a client-server architecture.

```text
                 ┌──────────────────────┐
                 │       USER           │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    React Frontend    │
                 │      (Vite)          │
                 └──────────┬───────────┘
                            │
                       Axios API
                            │
                            ▼
                 ┌──────────────────────┐
                 │   Express Backend   │
                 │     (Node.js)       │
                 └──────────┬───────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
       ┌────────────────┐     ┌────────────────┐
       │   MongoDB      │     │   Cloudinary   │
       │  Application   │     │  File Storage  │
       │      Data      │     │                │
       └────────────────┘     └────────────────┘
                │
                ▼
       ┌────────────────┐
       │   Nodemailer   │
       │ Email Services │
       └────────────────┘
```

---

## 📂 Project Folder Structure

The following is the project directory structure.

```text
Cloud_File_Sharing/
│
├── client/
│   ├── public/
│   │   ├── cloudspace-icon.png
│   │   ├── cloudspace-wordmark-dark.png
│   │   └── favicon.png
│   │
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   │
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   │
│   │   ├── components/
│   │   │   ├── FileCard.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Account.css
│   │   │   ├── Account.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Favorites.jsx
│   │   │   ├── Login.css
│   │   │   ├── Login.jsx
│   │   │   ├── ManageStorage.css
│   │   │   ├── ManageStorage.jsx
│   │   │   ├── MyFiles.css
│   │   │   ├── MyFiles.jsx
│   │   │   ├── RecentFiles.jsx
│   │   │   ├── RecycleBin.jsx
│   │   │   ├── Register.css
│   │   │   ├── Register.jsx
│   │   │   ├── Settings.css
│   │   │   ├── Settings.jsx
│   │   │   ├── SharedFile.css
│   │   │   ├── SharedFile.jsx
│   │   │   ├── SharedFiles.css
│   │   │   ├── SharedFiles.jsx
│   │   │   ├── VerifyEmail.css
│   │   │   └── VerifyEmail.jsx
│   │   │
│   │   ├── routes/
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── README.md
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── favoriteController.js
│   │   ├── fileAccessController.js
│   │   ├── fileController.js
│   │   ├── folderController.js
│   │   ├── notificationController.js
│   │   ├── recycleBinController.js
│   │   ├── sessionController.js
│   │   ├── shareController.js
│   │   ├── storageController.js
│   │   └── versionController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   ├── uploadErrorMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   ├── models/
│   │   ├── Favorite.js
│   │   ├── File.js
│   │   ├── FileVersion.js
│   │   ├── Folder.js
│   │   ├── LoginActivity.js
│   │   ├── Notification.js
│   │   ├── Session.js
│   │   ├── Share.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── favoriteRoutes.js
│   │   ├── fileRoutes.js
│   │   ├── folderRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── recycleBinRoutes.js
│   │   ├── sessionRoutes.js
│   │   └── shareRoutes.js
│   │
│   ├── utils/
│   │   ├── securityNotificationUtils.js
│   │   ├── sendEmail.js
│   │   └── sessionUtils.js
│   │
│   ├── index.js
│   ├── package-lock.json
│   ├── package.json
│   └── testEmail.js
│
└── .gitignore
```

---

## 🔗 API Documentation

The backend exposes RESTful API endpoints under the `/api` prefix.

**Base URL (local development):**

```text
http://localhost:5000/api
```

Authentication-protected endpoints require a valid authenticated session.

### 1. Authentication APIs

Base route: `/api/auth`

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/register` | Register a new user | Public |
| POST | `/verify-email` | Verify email using OTP | Public |
| POST | `/resend-otp` | Resend email verification OTP | Public |
| POST | `/login` | Authenticate user | Public |
| POST | `/verify-login-otp` | Verify login OTP | Public |
| POST | `/resend-login-otp` | Resend login OTP | Public |
| POST | `/logout` | Log out the user | Protected |
| PUT | `/two-factor` | Update two-factor authentication | Protected |
| GET | `/me` | Get authenticated user details | Protected |
| PUT | `/update-profile` | Update user profile | Protected |
| PUT | `/change-password` | Change account password | Protected |
| GET | `/notification-preferences` | Get notification preferences | Protected |
| PUT | `/notification-preferences` | Update notification preferences | Protected |
| GET | `/appearance-preferences` | Get appearance preferences | Protected |
| PUT | `/appearance-preferences` | Update appearance preferences | Protected |

### 2. File APIs

Base route: `/api/files`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/upload` | Upload a new file |
| GET | `/` | Retrieve user files |
| GET | `/storage` | Get storage information |
| PUT | `/:fileId/move` | Move a file |
| GET | `/:fileId/access` | Get file access information |
| DELETE | `/:fileId` | Delete a file |
| POST | `/:fileId/versions` | Upload a new file version |
| GET | `/:fileId/versions` | Get file version history |
| POST | `/:fileId/versions/:versionNumber/restore` | Restore a previous version |

### 3. Folder APIs

Base route: `/api/folders`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a folder |
| GET | `/` | Retrieve folders |
| PUT | `/:folderId` | Update a folder |
| DELETE | `/:folderId` | Delete a folder |

### 4. File Sharing APIs

Base route: `/api/shares`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Share a file with another user |
| GET | `/with-me` | Get files shared with the user |
| GET | `/by-me` | Get files shared by the user |
| DELETE | `/remove/:shareId` | Remove a shared-file access entry |
| DELETE | `/:shareId` | Delete a sharing record |

### 5. Favorites APIs

Base route: `/api/favorites`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Retrieve favorite files |
| POST | `/:fileId` | Add a file to favorites |
| DELETE | `/:fileId` | Remove a file from favorites |

### 6. Recycle Bin APIs

Base route: `/api/recycle-bin`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Retrieve deleted files |
| PUT | `/restore/:fileId` | Restore a deleted file |
| DELETE | `/permanent/:fileId` | Permanently delete a file |

### 7. Notification APIs

Base route: `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Retrieve notifications |
| PUT | `/read-all` | Mark all notifications as read |
| PUT | `/:id/read` | Mark a notification as read |
| DELETE | `/:id` | Delete a notification |

### 8. Session Management APIs

Base route: `/api/sessions`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/history` | Retrieve login history |
| GET | `/active` | Retrieve active sessions |
| DELETE | `/revoke-others` | Revoke other active sessions |
| DELETE | `/:sessionId` | Revoke a specific session |

### 9. Server Health Check

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check whether the backend server is running |

**Note:** All endpoints listed above are relative to their respective base routes. For example, `POST /register` under Authentication APIs corresponds to `POST /api/auth/register`.

---

## ⚙️ Installation and Setup

Follow these instructions to run CloudSpace on your local computer.

### Prerequisites

Make sure you have installed:

- Node.js and npm
- MongoDB Atlas account or a MongoDB instance
- Cloudinary account
- Gmail account with an app password for email functionality
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/sujji-cell/CloudSpace.git
```

Navigate into the project directory:

```bash
cd CloudSpace
```

### Step 2: Install Frontend Dependencies

```bash
cd client
npm install
```

### Step 3: Install Backend Dependencies

Open another terminal from the project root, or navigate back:

```bash
cd server
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

Replace the example values with your actual credentials.

**Important:**
- Never upload your `.env` file to GitHub.
- Never expose database credentials, JWT secrets, Cloudinary credentials, or email app passwords.
- Use a Gmail App Password rather than your regular Gmail password.
- Keep your credentials private.

### Step 5: Start the Backend Server

From the `server` directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

You can verify the server using:

```text
http://localhost:5000/
```

Expected response:

```text
CloudSpace Server is Running!
```

### Step 6: Start the Frontend

Open another terminal and navigate to the client directory:

```bash
cd client
npm run dev
```

Vite will display the local development URL, normally:

```text
http://localhost:5173
```

Open this address in your browser to access CloudSpace.

---

## 🔧 Available Scripts

### Frontend

Run these commands inside the `client` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build |
| `npm run lint` | Run Oxlint |
| `npm run preview` | Preview the production build |

### Backend

Run these commands inside the `server` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start the backend using Nodemon |

---

## 🔒 Security Considerations

CloudSpace incorporates multiple security measures:

- Password hashing using bcryptjs.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Protected backend routes.
- Email verification.
- OTP-based two-factor authentication.
- Temporary account lockout after repeated failed login attempts.
- Session tracking and revocation.
- Authenticated file access.
- Role-based sharing permissions.

Always configure environment variables securely when running or deploying the application.

---

## 🚀 Future Improvements

Potential enhancements for future versions include:

- Production deployment with a custom domain.
- Public share links with expiry dates.
- Advanced file search and filtering.
- Enhanced storage analytics.
- Drag-and-drop file uploads.
- Additional file preview formats.
- Automated testing and CI/CD integration.
- Improved mobile experience.

---

## 👨‍💻 Author

**Suraj Kumar**

GitHub: [@sujji-cell](https://github.com/sujji-cell)

Project Repository: [CloudSpace](https://github.com/sujji-cell/CloudSpace)

---

## 📄 License

This project is developed for educational and portfolio purposes.

A formal open-source license can be added if the project is intended for public reuse and distribution.

---

<p align="center">
  <strong>CloudSpace — Your Files, Your Space, Your Control.</strong>
</p>