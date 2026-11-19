import React from "react";

import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Login from "./pages/Login";
import MyFiles from "./pages/MyFiles";
import SharedFile from "./pages/SharedFile";
import SharedFiles from "./pages/SharedFiles";
import RecentFiles from "./pages/RecentFiles";
import Favorites from "./pages/Favorites";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {

    return (

        <AuthProvider>

            <BrowserRouter>

                <Routes>

                    {/* Public Routes */}

                    <Route
                        path="/register"
                        element={<Register />}
                    />

                    <Route
                        path="/verify-email"
                        element={<VerifyEmail />}
                    />

                    <Route
                        path="/login"
                        element={<Login />}
                    />


                    {/* Protected Routes */}

                    <Route element={<ProtectedRoute />}>

                        <Route
                            path="/"
                            element={<Dashboard />}
                        />

                        <Route
                            path="/my-files"
                            element={<MyFiles />}
                        />

                        <Route
                            path="/shared-files"
                            element={<SharedFiles />}
                        />

                        <Route
                            path="/recent-files"
                            element={<RecentFiles />}
                        />

                        <Route
                            path="/favorites"
                            element={<Favorites />}
                        />

                        <Route
                            path="/shared-file/:fileId"
                            element={<SharedFile />}
                        />

                    </Route>


                    {/* Unknown Routes */}

                    <Route
                        path="*"
                        element={<Navigate to="/" replace />}
                    />

                </Routes>

            </BrowserRouter>

        </AuthProvider>

    );

}

export default App;