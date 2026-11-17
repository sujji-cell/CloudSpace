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