import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Cloud, Mail, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";
import api from "../api/axios";
import "./VerifyEmail.css";

function VerifyEmail() {
    const location = useLocation();
    const navigate = useNavigate();

    // Get email passed from Register page
    const email = location.state?.email || "";

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [countdown, setCountdown] = useState(60);

    const inputRefs = useRef([]);

    // Redirect if email is not available
    useEffect(() => {
        if (!email) {
            navigate("/register", { replace: true });
        }
    }, [email, navigate]);

    // Resend OTP countdown
    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setTimeout(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    // Handle OTP input
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;

        const updatedOtp = [...otp];
        updatedOtp[index] = value.slice(-1);

        setOtp(updatedOtp);
        setError("");
        setSuccess("");

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace
    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Handle pasting OTP
    const handlePaste = (e) => {
        e.preventDefault();

        const pastedValue = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pastedValue) return;

        const updatedOtp = [...otp];

        pastedValue.split("").forEach((digit, index) => {
            updatedOtp[index] = digit;
        });

        setOtp(updatedOtp);
        setError("");

        const nextIndex = Math.min(pastedValue.length, 5);
        inputRefs.current[nextIndex]?.focus();
    };

    // Verify email
    const handleVerify = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const enteredOtp = otp.join("");

        if (enteredOtp.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post("/auth/verify-email", {
                email,
                otp: enteredOtp
            });

            console.log("Verification Response:", response.data);

            if (response.data.success === false) {
                setError(response.data.message || "Verification failed.");
                return;
            }

            setSuccess("Your email has been verified successfully!");

            // Redirect to login after successful verification
            setTimeout(() => {
                navigate("/login", {
                    replace: true,
                    state: {
                        email,
                        verified: true
                    }
                });
            }, 1500);

        } catch (err) {
            console.error("Verification Error:", err);
            console.error("Backend Response:", err.response?.data);

            setError(
                err.response?.data?.message ||
                "Invalid or expired OTP. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        setError("");
        setSuccess("");

        try {
            setResending(true);

            const response = await api.post("/auth/resend-otp", {
                email
            });

            console.log("Resend OTP Response:", response.data);

            if (response.data.success === false) {
                setError(response.data.message || "Unable to resend OTP.");
                return;
            }

            setSuccess("A new verification code has been sent to your email.");

            setOtp(["", "", "", "", "", ""]);
            setCountdown(60);

            inputRefs.current[0]?.focus();

        } catch (err) {
            console.error("Resend OTP Error:", err);
            console.error("Backend Response:", err.response?.data);

            setError(
                err.response?.data?.message ||
                "Unable to resend OTP. Please try again."
            );

        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return null;
    }

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

                <div className="verify-icon">
                    <Mail size={30} />
                </div>

                <div className="verify-heading">
                    <h1>Verify your email</h1>

                    <p>
                        We've sent a 6-digit verification code to
                    </p>

                    <strong>{email}</strong>
                </div>

                <form onSubmit={handleVerify}>

                    {/* OTP Inputs */}
                    <div className="otp-container">

                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(element) => {
                                    inputRefs.current[index] = element;
                                }}
                                type="text"
                                inputMode="numeric"
                                autoComplete={index === 0 ? "one-time-code" : "off"}
                                maxLength="1"
                                value={digit}
                                onChange={(e) =>
                                    handleOtpChange(index, e.target.value)
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(index, e)
                                }
                                onPaste={handlePaste}
                                aria-label={`OTP digit ${index + 1}`}
                                className="otp-input"
                            />
                        ))}

                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="verify-error" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="verify-success" role="status">
                            <CheckCircle size={17} />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        type="submit"
                        className="verify-submit-btn"
                        disabled={loading || !!success}
                    >
                        {loading
                            ? "Verifying..."
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
                            disabled={resending}
                        >
                            <RefreshCw size={15} />
                            {resending ? "Sending..." : "Resend Code"}
                        </button>
                    )}

                </div>

                {/* Back to Registration */}
                <Link to="/register" className="verify-back-link">
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