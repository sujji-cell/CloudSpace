import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {

    const { user, loading } = useAuth();
    const location = useLocation();

    console.log("ProtectedRoute Debug:", {
        pathname: location.pathname,
        loading,
        user
    });

    if (loading) {
        return <h3>Checking authentication...</h3>;
    }

    if (!user) {
        console.log("Redirecting to login...");
        return (
            <Navigate
                to="/login"
                state={{ from: location }}
                replace
            />
        );
    }

    console.log("Authentication successful. Rendering:", location.pathname);

    return <Outlet />;
}

export default ProtectedRoute;