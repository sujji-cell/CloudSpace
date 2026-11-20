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

    // Appearance states
    const [theme, setTheme] = useState("light");
    const [accentColor, setAccentColor] = useState("blue");

    // Sidebar and layout states
    const [sidebar, setSidebar] = useState("expanded");
    const [density, setDensity] = useState("comfortable");


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
                setAccentColor("blue");
                setSidebar("expanded");
                setDensity("comfortable");

                return;

            }

            try {

                const response = await api.get(
                    "/auth/appearance-preferences"
                );

                const preferences = response.data.preferences;

                // Theme
                setTheme(
                    preferences?.theme || "light"
                );

                // Accent Color
                setAccentColor(
                    preferences?.accentColor || "blue"
                );

                // Sidebar
                setSidebar(
                    preferences?.sidebar || "expanded"
                );

                // Layout Density
                setDensity(
                    preferences?.density || "comfortable"
                );

            } catch (error) {

                console.error(
                    "Unable to load appearance preferences:",
                    error
                );

                setTheme("light");
                setAccentColor("blue");
                setSidebar("expanded");
                setDensity("comfortable");

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


    // Apply accent color globally
    useEffect(() => {

        const root = document.documentElement;

        root.setAttribute("data-accent", accentColor);

    }, [accentColor]);


    // Apply sidebar preference globally
    useEffect(() => {

        const root = document.documentElement;

        root.setAttribute("data-sidebar", sidebar);

    }, [sidebar]);


    // Apply layout density globally
    useEffect(() => {

        const root = document.documentElement;

        root.setAttribute("data-density", density);

    }, [density]);


    return (

        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                checkAuth,

                // Theme
                theme,
                setTheme,

                // Accent Color
                accentColor,
                setAccentColor,

                // Sidebar
                sidebar,
                setSidebar,

                // Layout Density
                density,
                setDensity
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