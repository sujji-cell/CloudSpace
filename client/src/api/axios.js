
import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000/api",
    withCredentials: true
});

// Detect supported browsers and identify them to the backend.
api.interceptors.request.use(async (config) => {
    try {
        let browser = null;

        // Brave detection
        if (
            navigator.brave &&
            await navigator.brave.isBrave()
        ) {
            browser = "Brave";
        }

        // Vivaldi detection
        else if (/Vivaldi/i.test(navigator.userAgent)) {
            browser = "Vivaldi";
        }

        // Send detected browser to backend
        if (browser) {
            config.headers["x-client-browser"] = browser;
        }

    } catch (error) {
        console.error("Browser detection error:", error);
    }

    return config;
});

export default api;
