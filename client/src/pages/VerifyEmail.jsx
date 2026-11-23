import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    Cloud,
    Mail,
    ArrowLeft,
    CheckCircle,
    RefreshCw
} from "lucide-react";

import api from "../api/axios";
import "./VerifyEmail.css";

function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();

    const email = location.state?.email || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [countdown, setCountdown] = useState(60);

    const inputRefs = useRef([]);
    const redirectTimerRef = useRef(null);

    const isVerified = Boolean(success && !loading);

    // ==========================================
    // REDIRECT IF EMAIL IS MISSING
    // ==========================================

    useEffect(() => {
        if (!email) {
            navigate("/register", { replace: true });
        }
    }, [email, navigate]);

    // ==========================================
    // CLEANUP REDIRECT TIMER
    // ==========================================

    useEffect(() => {
        return () => {
            if (redirectTimerRef.current) {
                clearTimeout(redirectTimerRef.current);
            }
        };
    }, []);

    // ==========================================
    // OTP RESEND COUNTDOWN
    // ==========================================

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setTimeout(() => {
            setCountdown((previous) => previous - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    // ==========================================
    // RESET OTP
    // ==========================================

    const resetOtp = () => {
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
    };

    // ==========================================
    // UPDATE OTP INPUTS
    // ==========================================

    const handleOtpChange = (index, value) => {
        if (loading || isVerified) return;

        const digits = value.replace(/\D/g, "");

        setError("");
        setSuccess("");

        // Handle browser OTP autofill or multi-digit input
        if (digits.length > 1) {
            const updatedOtp = ["", "", "", "", "", ""];

            digits.slice(0, 6).split("").forEach((digit, digitIndex) => {
                updatedOtp[digitIndex] = digit;
            });

            setOtp(updatedOtp);

            const nextIndex = Math.min(digits.length, 5);

            inputRefs.current[nextIndex]?.focus();

            return;
        }

        const updatedOtp = [...otp];

        updatedOtp[index] = digits.slice(-1);

        setOtp(updatedOtp);

        // Move to next input automatically
        if (digits && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // ==========================================
    // KEYBOARD NAVIGATION
    // ==========================================

    const handleKeyDown = (index, e) => {
        if (loading || isVerified) return;

        // Move backward using Backspace
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }

        // Navigate left
        if (e.key === "ArrowLeft" && index > 0) {
            e.preventDefault();
            inputRefs.current[index - 1]?.focus();
        }

        // Navigate right
        if (e.key === "ArrowRight" && index < 5) {
            e.preventDefault();
            inputRefs.current[index + 1]?.focus();
        }
    };

    // ==========================================
    // PASTE OTP
    // ==========================================

    const handlePaste = (e) => {
        if (loading || isVerified) return;

        e.preventDefault();

        const pastedValue = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedValue) return;

        const updatedOtp = ["", "", "", "", "", ""];

        pastedValue.split("").forEach((digit, index) => {
            updatedOtp[index] = digit;
        });

        setOtp(updatedOtp);
        setError("");
        setSuccess("");

        const nextIndex = Math.min(pastedValue.length, 5);

        inputRefs.current[nextIndex]?.focus();
    };

    // ==========================================
    // VERIFY EMAIL
    // ==========================================

    const handleVerify = async (e) => {
        e.preventDefault();

        if (loading || resending || isVerified) return;

        setError("");
        setSuccess("");

        const enteredOtp = otp.join("");

        if (!/^\d{6}$/.test(enteredOtp)) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/verify-email", {
                email,
                otp: enteredOtp
            });

            if (response.data?.success === false) {
                setError(
                    response.data.message || "Email verification failed."
                );
                return;
            }

            setSuccess("Your email has been verified successfully!");

            // Redirect to login after successful verification
            redirectTimerRef.current = setTimeout(() => {
                navigate("/login", {
                    replace: true,
                    state: {
                        email,
                        verified: true
                    }
                });
            }, 1500);

        } catch (err) {
            console.error("Email Verification Error:", err);

            setError(
                err.response?.data?.message ||
                "Invalid or expired OTP. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // RESEND OTP
    // ==========================================

    const handleResendOtp = async () => {
        if (resending || loading || countdown > 0 || isVerified) return;

        setError("");
        setSuccess("");

        try {
            setResending(true);

            const response = await api.post("/auth/resend-otp", {
                email
            });

            if (response.data?.success === false) {
                setError(
                    response.data.message || "Unable to resend OTP."
                );
                return;
            }

            setSuccess(
                "A new verification code has been sent to your email."
            );

            resetOtp();

            // Restart countdown only after successful resend
            setCountdown(60);

        } catch (err) {
            console.error("Resend OTP Error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to resend OTP. Please try again."
            );

        } finally {
            setResending(false);
        }
    };

    // ==========================================
    // WAIT WHILE REDIRECTING
    // ==========================================

    if (!email) {
        return null;
    }

    // ==========================================
    // UI
    // ==========================================

    return (
        <div className="verify-page">

            {/* Brand */}

            <div className="verify-brand">
                <div className="verify-brand-icon">
                    <Cloud size={23} />
                </div>

                <span>CloudSpace</span>
            </div>

            {/* Verification Card */}

            <div className="verify-card">

                {/* Icon */}

                <div className="verify-icon">
                    <Mail size={30} />
                </div>

                {/* Heading */}

                <div className="verify-heading">

                    <h1>Verify your email</h1>

                    <p>
                        We've sent a 6-digit verification code to
                    </p>

                    <strong>{email}</strong>

                </div>

                {/* OTP Form */}

                <form onSubmit={handleVerify}>

                    <div
                        className="otp-container"
                        role="group"
                        aria-label="Enter your six-digit email verification code"
                    >

                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(element) => {
                                    inputRefs.current[index] = element;
                                }}
                                type="text"
                                inputMode="numeric"
                                autoComplete={
                                    index === 0 ? "one-time-code" : "off"
                                }
                                pattern="[0-9]*"
                                maxLength={6}
                                value={digit}
                                disabled={loading || isVerified}
                                onChange={(e) =>
                                    handleOtpChange(index, e.target.value)
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(index, e)
                                }
                                onPaste={handlePaste}
                                aria-label={`OTP digit ${index + 1}`}
                                aria-invalid={Boolean(error)}
                                className="otp-input"
                            />
                        ))}

                    </div>

                    {/* Error */}

                    {error && (
                        <div
                            className="verify-error"
                            role="alert"
                            aria-live="assertive"
                        >
                            {error}
                        </div>
                    )}

                    {/* Success */}

                    {success && (
                        <div
                            className="verify-success"
                            role="status"
                            aria-live="polite"
                        >
                            <CheckCircle size={17} />

                            <span>{success}</span>
                        </div>
                    )}

                    {/* Verify Button */}

                    <button
                        type="submit"
                        className="verify-submit-btn"
                        disabled={
                            loading ||
                            resending ||
                            isVerified ||
                            otp.join("").length !== 6
                        }
                    >
                        {loading
                            ? "Verifying..."
                            : isVerified
                                ? "Email Verified"
                                : "Verify Email"
                        }
                    </button>

                </form>

                {/* Resend OTP */}

                <div className="resend-section">

                    <p>Didn't receive the code?</p>

                    {countdown > 0 ? (

                        <span className="resend-timer">
                            Resend code in {countdown}s
                        </span>

                    ) : (

                        <button
                            type="button"
                            className="resend-btn"
                            onClick={handleResendOtp}
                            disabled={
                                resending ||
                                loading ||
                                isVerified
                            }
                        >
                            <RefreshCw
                                size={15}
                                className={resending ? "resend-spinning" : ""}
                            />

                            {resending
                                ? "Sending..."
                                : "Resend Code"
                            }

                        </button>

                    )}

                </div>

                {/* Back to Registration */}

                <Link
                    to="/register"
                    className="verify-back-link"
                    onClick={() => {
                        if (redirectTimerRef.current) {
                            clearTimeout(redirectTimerRef.current);
                        }
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to registration
                </Link>

            </div>

            {/* Footer */}

            <p className="verify-footer">
                CloudSpace © 2026 · Secure cloud storage and sharing
            </p>

        </div>
    );
}

export default VerifyEmail;