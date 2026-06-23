import axios from "axios";
import { toast } from "sonner";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  paramsSerializer: { indexes: null },
});

// Attach auth token to every request
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth-token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRedirecting = false;

// Normalize error messages
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redirect to login if unauthorized and not on auth pages
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const isAuthPage = window.location.pathname.startsWith('/auth');
      if (!isAuthPage && !isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem("auth-token");
        localStorage.removeItem("auth-user");
        document.cookie = "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        window.location.href = "/auth/login";
      }
    }

    const data = error.response?.data;
    let message = data?.message ?? error.message;

    // Extract specific validation error messages if Unprocessable Entity
    if (error.response?.status === 422 || data?.message === "Unprocessable Entity") {
      if (Array.isArray(data?.error)) {
        message = data.error.map((err: { message: string; path: string }) => err.message).join(", ");
        if (data) data.message = message;
      }
      
      // Show global toast for Unprocessable Entity
      if (typeof window !== "undefined") {
        toast.error(message);
      }
    }

    // Override the generic axios error message with the backend message
    error.message = message;

    return Promise.reject(error);
  }
);

export default axiosInstance;
