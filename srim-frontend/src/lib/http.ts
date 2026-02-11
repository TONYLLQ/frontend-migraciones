import axios from "axios";

// Using VITE_API_URL or defaulting to localhost:8000 if not set
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const http = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        "Content-Type": "application/json",
    },
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
