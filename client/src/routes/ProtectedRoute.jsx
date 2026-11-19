import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {

    const { user, loading } = useAuth();
    const location = useLocation();

    // Wait until authentication check is complete
    if (loading) {
        return (
            <div className="auth-loading">
                <h3>Checking authentication...</h3>
            </div>
        );
    }

    // Redirect to login and remember the requested page
    if (!user) {
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    // Allow authenticated users
    return <Outlet />;
}

export default ProtectedRoute;