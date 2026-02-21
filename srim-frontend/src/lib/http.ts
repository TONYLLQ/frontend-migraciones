import axios from "axios";
import { clearAuthToken, setAuthToken } from "@/lib/auth";

// Using VITE_API_URL or defaulting to localhost:8000 if not set
export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const http = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

http.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
        config.headers = config.headers ?? {};
        delete (config.headers as Record<string, string>)["Content-Type"];
        delete (config.headers as Record<string, string>)["content-type"];
    }
    return config;
});

let isRefreshing = false;
let failedQueue: { resolve: (val?: unknown) => void; reject: (err: unknown) => void }[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const status = error?.response?.status;

        if (status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = "Bearer " + token;
                        return axios(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refresh_token");

            if (!refreshToken) {
                isRefreshing = false;
                clearAuthToken();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }

            try {
                const rs = await axios.post(`${API_URL}/api/token/refresh/`, {
                    refresh: refreshToken,
                });

                const newAccessToken = rs.data.access || rs.data.token || rs.data.access_token;
                if (!newAccessToken) {
                    throw new Error("No access token returned");
                }

                setAuthToken(newAccessToken);
                originalRequest.headers.Authorization = "Bearer " + newAccessToken;

                processQueue(null, newAccessToken);

                return axios(originalRequest);
            } catch (_error) {
                processQueue(_error, null);
                clearAuthToken();
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(_error);
            } finally {
                isRefreshing = false;
            }
        }

        if (status === 403) {
            clearAuthToken();
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);
