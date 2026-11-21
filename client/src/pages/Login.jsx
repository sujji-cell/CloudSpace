import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    Eye,
    EyeOff,
    Cloud,
    Mail,
    Lock,
    CheckCircle,
    ShieldCheck,
    ArrowLeft
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

import "./Login.css";

function Login() {

    const navigate = useNavigate();
    const location = useLocation();

    const { setUser } = useAuth();

    // Login form
    const [formData, setFormData] = useState({
        email: location.state?.email || "",
        password: ""
    });

    // Login states
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Two-factor authentication states
    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpLoading, setOtpLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCountdown, setResendCountdown] = useState(0);

    const verified = location.state?.verified;

    // ==========================================
    // OTP RESEND COUNTDOWN
    // ==========================================

    useEffect(() => {

        if (resendCountdown <= 0) {
            return;
        }

        const timer = setTimeout(() => {
            setResendCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);

    }, [resendCountdown]);




    // ==========================================
    // NAVIGATION AFTER LOGIN
    // ==========================================

    // ==========================================
// NAVIGATION AFTER LOGIN
// ==========================================

const navigateAfterLogin = () => {
    navigate("/", { replace: true });
};

    // ==========================================
    // HANDLE INPUT CHANGES
    // ==========================================

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        setError("");

    };


    // ==========================================
    // HANDLE LOGIN
    // ==========================================

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

            // Check if 2FA is required
            if (response.data.requiresTwoFactor) {

                setRequiresTwoFactor(true);

                // Initial OTP resend cooldown
                setResendCountdown(60);

                setError("");

                return;
            }

            // Normal login
            const loggedInUser = response.data.user;

            if (!loggedInUser) {
                setError(
                    "Login successful, but user information was not returned."
                );
                return;
            }

            setUser(loggedInUser);

            navigateAfterLogin();

        } catch (err) {

            console.error("Login Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to login. Please check your credentials."
            );

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // VERIFY LOGIN OTP
    // ==========================================

    const handleVerifyOtp = async (e) => {

        e.preventDefault();
        setError("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        try {

            setOtpLoading(true);

            const response = await api.post(
                "/auth/verify-login-otp",
                {
                    email: formData.email.trim().toLowerCase(),
                    otp
                }
            );

            console.log("OTP Verification Response:", response.data);

            if (!response.data.user) {
                setError("Unable to complete login.");
                return;
            }

            // Store authenticated user
            setUser(response.data.user);

            // Navigate to dashboard
            navigateAfterLogin();

        } catch (err) {

            console.error("OTP Verification Error:", err);

            setError(
                err.response?.data?.message ||
                "OTP verification failed. Please try again."
            );

        } finally {

            setOtpLoading(false);

        }

    };


    // ==========================================
    // RESEND LOGIN OTP
    // ==========================================

    const handleResendOtp = async () => {

        setError("");

        try {

            setResendLoading(true);

            const response = await api.post(
                "/auth/resend-login-otp",
                {
                    email: formData.email.trim().toLowerCase()
                }
            );

            console.log("Resend OTP Response:", response.data);

            setResendCountdown(60);
            setOtp("");

            setError("");

            alert("A new verification code has been sent to your email.");

        } catch (err) {

            console.error("Resend OTP Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to resend OTP."
            );

        } finally {

            setResendLoading(false);

        }

    };


    // ==========================================
    // BACK TO LOGIN
    // ==========================================

    const handleBackToLogin = () => {

        setRequiresTwoFactor(false);
        setOtp("");
        setError("");
        setResendCountdown(0);

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


                {/* ======================================
                    TWO-FACTOR OTP SCREEN
                ====================================== */}

                {requiresTwoFactor ? (

                    <>

                        <div className="login-heading">

                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: "15px"
                            }}>

                                <ShieldCheck
                                    size={42}
                                    color="#4169e1"
                                />

                            </div>

                            <h1>Verify your identity</h1>

                            <p>
                                We've sent a 6-digit verification code
                                to your registered email address.
                            </p>

                            <p style={{
                                fontWeight: "600",
                                marginTop: "10px"
                            }}>

                                {formData.email}

                            </p>

                        </div>


                        <form onSubmit={handleVerifyOtp}>

                            {/* OTP Input */}
                            <div className="login-input-group">

                                <label>Verification Code</label>

                                <div className="login-input-wrapper">

                                    <ShieldCheck size={18} />

                                    <input
                                        type="text"
                                        name="otp"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => {

                                            const value = e.target.value
                                                .replace(/\D/g, "")
                                                .slice(0, 6);

                                            setOtp(value);
                                            setError("");

                                        }}
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        required
                                    />

                                </div>

                            </div>


                            {/* Error */}
                            {error && (

                                <div
                                    className="login-error"
                                    role="alert"
                                >
                                    {error}
                                </div>

                            )}


                            {/* Verify Button */}
                            <button
                                type="submit"
                                className="login-submit-btn"
                                disabled={otpLoading}
                            >

                                {otpLoading
                                    ? "Verifying..."
                                    : "Verify & Sign In"
                                }

                            </button>

                        </form>


                        {/* Resend OTP */}
                        <div className="login-switch">

                            Didn't receive the code?{" "}

                            {resendCountdown > 0 ? (

                                <span>
                                    Resend in {resendCountdown}s
                                </span>

                            ) : (

                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendLoading}
                                    style={{
                                        border: "none",
                                        background: "none",
                                        color: "#4169e1",
                                        fontWeight: "600",
                                        cursor: "pointer"
                                    }}
                                >

                                    {resendLoading
                                        ? "Sending..."
                                        : "Resend OTP"
                                    }

                                </button>

                            )}

                        </div>


                        {/* Back Button */}
                        <div className="login-switch">

                            <button
                                type="button"
                                onClick={handleBackToLogin}
                                style={{
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}
                            >

                                <ArrowLeft size={15} />

                                Back to login

                            </button>

                        </div>

                    </>

                ) : (

                    /* ======================================
                       NORMAL LOGIN SCREEN
                    ====================================== */

                    <>

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
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
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

                                <div
                                    className="login-error"
                                    role="alert"
                                >
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

                    </>

                )}

            </div>


            {/* Footer */}
            <p className="login-footer">

                CloudSpace © 2026 · Secure cloud storage and sharing

            </p>

        </div>

    );

}

export default Login;