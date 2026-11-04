import axios from "axios";

// When deployed on Vercel as a combined fullstack app, frontend and backend share the same domain (/api).
// In local development, fall back to http://localhost:5000/api if VITE_API_URL is not explicitly set.
const defaultBaseUrl = import.meta.env.PROD ? "/api" : "http://localhost:5000/api";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
