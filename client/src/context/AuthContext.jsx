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

    return (

        <AuthContext.Provider
            value={{
                user,
                setUser,
                loading,
                checkAuth
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