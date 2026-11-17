import React from "react";
import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {

    const { user, loading } = useAuth();

    // Wait until authentication check is complete
    if (loading) {
        return (
            <div className="auth-loading">
                <h3>Checking authentication...</h3>
            </div>
        );
    }

    // Redirect if user is not logged in
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Allow authenticated users
    return <Outlet />;
}

export default ProtectedRoute;