import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Cloud, Mail, Lock, CheckCircle } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import "./Login.css";

function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const { setUser } = useAuth();

    const [formData, setFormData] = useState({
        email: location.state?.email || "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const verified = location.state?.verified;

    // Handle input changes
    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError("");
    };

    // Handle login
    const handleSubmit = async (e) => {

        e.preventDefault();
        setError("");

        const { email, password } = formData;

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        try {

            setLoading(true);

            const response = await api.post("/auth/login", {
                email: email.trim().toLowerCase(),
                password
            });

            console.log("Login Response:", response.data);

            if (response.data.success === false) {

                setError(response.data.message || "Login failed.");
                return;

            }

            // Store logged-in user
            const loggedInUser = response.data.user;

            if (!loggedInUser) {
                setError("Login successful, but user information was not returned.");
                return;
            }

            setUser(loggedInUser);

            // Return to the originally requested page
            const redirectPath = location.state?.from
                ? location.state.from.pathname +
                  location.state.from.search +
                  location.state.from.hash
                : "/";

            navigate(redirectPath, { replace: true });

        } catch (err) {

            console.error("Login Error:", err);
            console.error("Backend Response:", err.response?.data);

            setError(
                err.response?.data?.message ||
                "Unable to login. Please check your credentials."
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <div className="login-page">

            {/* Brand */}
            <div className="login-brand">

                <div className="login-brand-icon">
                    <Cloud size={23} />
                </div>

                <span>CloudSpace</span>

            </div>

            {/* Login Card */}
            <div className="login-card">

                <div className="login-heading">

                    <h1>Welcome back</h1>

                    <p>
                        Sign in to access your files and workspace.
                    </p>

                </div>

                {/* Verification Success */}
                {verified && (

                    <div className="login-success">

                        <CheckCircle size={17} />

                        <span>
                            Email verified successfully! You can now sign in.
                        </span>

                    </div>

                )}

                <form onSubmit={handleSubmit}>

                    {/* Email */}
                    <div className="login-input-group">

                        <label>Email Address</label>

                        <div className="login-input-wrapper">

                            <Mail size={18} />

                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />

                        </div>

                    </div>

                    {/* Password */}
                    <div className="login-input-group">

                        <label>Password</label>

                        <div className="login-input-wrapper">

                            <Lock size={18} />

                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="login-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label="Toggle password visibility"
                            >

                                {showPassword
                                    ? <EyeOff size={18} />
                                    : <Eye size={18} />
                                }

                            </button>

                        </div>

                    </div>

                    {/* Error */}
                    {error && (

                        <div className="login-error" role="alert">
                            {error}
                        </div>

                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="login-submit-btn"
                        disabled={loading}
                    >

                        {loading ? "Signing In..." : "Sign In"}

                    </button>

                </form>

                {/* Register Link */}
                <div className="login-switch">

                    Don't have an account?{" "}

                    <Link to="/register">
                        Create account
                    </Link>

                </div>

            </div>

            {/* Footer */}
            <p className="login-footer">

                CloudSpace © 2026 · Secure cloud storage and sharing

            </p>

        </div>

    );

}

export default Login;