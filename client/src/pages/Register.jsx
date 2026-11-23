import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    Eye,
    EyeOff,
    Cloud,
    User,
    Mail,
    Lock
} from "lucide-react";

import api from "../api/axios";
import "./Register.css";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [firstNameError, setFirstNameError] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    // Handle input changes
    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (name === "firstName" && value.trim()) {
            setFirstNameError("");
        }

        setError("");

    };


    // Handle registration
    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setFirstNameError("");

        // Read actual form values (also handles browser autofill)
        const submittedData = new FormData(e.currentTarget);

        const firstName = String(submittedData.get("firstName") || "").trim();
        const middleName = String(submittedData.get("middleName") || "").trim();
        const lastName = String(submittedData.get("lastName") || "").trim();
        const email = String(submittedData.get("email") || "").trim().toLowerCase();
        const password = String(submittedData.get("password") || "");
        const confirmPassword = String(submittedData.get("confirmPassword") || "");

        // First name validation
        if (!firstName) {
            setFirstNameError("First name is required.");
            return;
        }

        // Email validation
        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        // Password validation
        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        // Confirm password validation
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);

            const response = await api.post("/auth/register", {

                firstName,
                middleName,
                lastName,
                email,
                password

            });

            if (response.status >= 200 && response.status < 300) {

                navigate("/verify-email", {
                    state: {
                        email
                    }
                });

            }

        } catch (err) {

            setError(
                err.response?.data?.message ||
                "Registration failed. Please try again."
            );

        } finally {

            setLoading(false);

        }

    };


    return (

        <div className="auth-page">

            {/* BRAND */}

            <div className="auth-logo">

                <div className="auth-logo-icon">
                    <Cloud size={28} />
                </div>

                <h2>CloudSpace</h2>

            </div>


            {/* REGISTRATION CARD */}

            <div className="auth-card">

                <h1>Create Account</h1>

                <p className="auth-subtitle">
                    Create your account and start managing your files.
                </p>


                <form onSubmit={handleSubmit}>

                    {/* FIRST NAME AND MIDDLE NAME */}

                    <div className="auth-name-row">

                        <div className="auth-input-group">

                            <label htmlFor="firstName">
                                First Name *
                            </label>

                            <div className="auth-input-wrapper">

                                <User size={18} />

                                <input
                                    id="firstName"
                                    type="text"
                                    name="firstName"
                                    placeholder="First name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    autoComplete="given-name"
                                    maxLength={50}
                                    required
                                />

                            </div>

                            {firstNameError && (
                                <p className="auth-error" role="alert">
                                    {firstNameError}
                                </p>
                            )}

                        </div>


                        <div className="auth-input-group">

                            <label htmlFor="middleName">
                                Middle Name
                            </label>

                            <div className="auth-input-wrapper">

                                <User size={18} />

                                <input
                                    id="middleName"
                                    type="text"
                                    name="middleName"
                                    placeholder="Middle name"
                                    value={formData.middleName}
                                    onChange={handleChange}
                                    autoComplete="additional-name"
                                    maxLength={50}
                                />

                            </div>

                        </div>

                    </div>


                    {/* LAST NAME */}

                    <div className="auth-input-group">

                        <label htmlFor="lastName">
                            Last Name
                        </label>

                        <div className="auth-input-wrapper">

                            <User size={18} />

                            <input
                                id="lastName"
                                type="text"
                                name="lastName"
                                placeholder="Enter your last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                autoComplete="family-name"
                                maxLength={50}
                            />

                        </div>

                    </div>


                    {/* EMAIL */}

                    <div className="auth-input-group">

                        <label htmlFor="email">
                            Email Address *
                        </label>

                        <div className="auth-input-wrapper">

                            <Mail size={18} />

                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                maxLength={254}
                                required
                            />

                        </div>

                    </div>


                    {/* PASSWORD */}

                    <div className="auth-input-group">

                        <label htmlFor="password">
                            Password *
                        </label>

                        <div className="auth-input-wrapper">

                            <Lock size={18} />

                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >

                                {showPassword
                                    ? <EyeOff size={18} />
                                    : <Eye size={18} />
                                }

                            </button>

                        </div>

                    </div>


                    {/* CONFIRM PASSWORD */}

                    <div className="auth-input-group">

                        <label htmlFor="confirmPassword">
                            Confirm Password *
                        </label>

                        <div className="auth-input-wrapper">

                            <Lock size={18} />

                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Confirm your password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                                required
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? "Hide confirm password"
                                        : "Show confirm password"
                                }
                            >

                                {showConfirmPassword
                                    ? <EyeOff size={18} />
                                    : <Eye size={18} />
                                }

                            </button>

                        </div>

                    </div>


                    {/* GENERAL ERROR */}

                    {error && (

                        <p className="auth-error" role="alert">
                            {error}
                        </p>

                    )}


                    {/* SUBMIT BUTTON */}

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating Account..."
                            : "Create Account"
                        }

                    </button>

                </form>


                {/* LOGIN LINK */}

                <p className="auth-footer">

                    Already have an account?{" "}

                    <Link to="/login">
                        Sign in
                    </Link>

                </p>

            </div>


            {/* PAGE FOOTER */}

            <p className="auth-page-footer">
                CloudSpace © 2026 · Secure cloud storage and sharing
            </p>

        </div>

    );

}

export default Register;