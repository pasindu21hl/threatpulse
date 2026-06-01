import axios from "axios";

const BASE_URL = typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
  ? window.location.origin
  : "http://localhost:8000";

// Create an Axios instance targeting the FastAPI backend
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

export default api;
