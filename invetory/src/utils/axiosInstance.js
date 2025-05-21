// src/utils/axiosInstance.js
import axios from "axios";

const username = import.meta.env.VITE_API_USER;
const password = import.meta.env.VITE_API_PASS;
const token = btoa(`${username}:${password}`); // Base64 encode

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        "Authorization": `Basic ${token}`,
    }
});

export default axiosInstance;
