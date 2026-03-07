// API configuration for axios
import axios from 'axios';

// Use environment variable if set (for production), otherwise use relative paths (for development)
// We intentionally avoid hard-coding any specific hosting provider URL (Railway, Render, etc.)
// so that the frontend will always talk either to the URL in VITE_API_URL or to the same origin.
const envUrl = (import.meta.env.VITE_API_URL || '').trim();
const baseURL = envUrl || '';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
