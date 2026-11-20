import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from "react";

import api from "../api/axios";

// Create authentication context
const AuthContext = createContext();

// Auth Provider
export const AuthProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Appearance state
    const [theme, setTheme] = useState("light");

    // Check whether user is already logged in
    const checkAuth = async () => {

        try {

            const response = await api.get("/auth/me");

            setUser(response.data.user);

        } catch (error) {

            setUser(null);

        } finally {

            setLoading(false);

        }
    };

    // Check authentication when application loads
    useEffect(() => {

        checkAuth();

    }, []);

    // Load saved appearance preferences
    useEffect(() => {

        const fetchAppearance = async () => {

            if (!user) {

                setTheme("light");
                return;

            }

            try {

                const response = await api.get(
                    "/auth/appearance-preferences"
                );

                setTheme(
                    response.data.preferences?.theme || "light"
                );

            } catch (error) {

                console.error(
                    "Unable to load appearance preferences:",
                    error
                );

                setTheme("light");

            }

        };

        fetchAppearance();

    }, [user]);

    // Apply theme globally
    useEffect(() => {

        const root = document.documentElement;

        const applyTheme = (selectedTheme) => {

            root.setAttribute("data-theme", selectedTheme);

        };

        if (theme === "system") {

            const mediaQuery = window.matchMedia(
                "(prefers-color-scheme: dark)"
            );

            applyTheme(
                mediaQuery.matches ? "dark" : "light"
            );

            const handleSystemThemeChange = (event) => {

                applyTheme(
                    event.matches ? "dark" : "light"
                );

            };

            mediaQuery.addEventListener(
                "change",
                handleSystemThemeChange
            );

            return () => {

                mediaQuery.removeEventListener(
                    "change",
                    handleSystemThemeChange
                );

            };

        }

        applyTheme(theme);

    }, [theme]);

    return (

        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                checkAuth,
                theme,
                setTheme
            }}
        >

            {children}

        </AuthContext.Provider>

    );
};

// Custom hook to access authentication
export const useAuth = () => {

    return useContext(AuthContext);

};