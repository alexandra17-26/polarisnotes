// API configuration for axios
import axios from 'axios';

// Use environment variable if set (for production), otherwise use relative paths (for development)
// Fallback for production: if we're on polarisnotes.com and env var is missing, use Railway backend
const envUrl = import.meta.env.VITE_API_URL || '';
const isProduction = typeof window !== 'undefined' && /polarisnotes\.com/.test(window.location.hostname);
const baseURL = envUrl || (isProduction ? 'https://polarisnotes-production.up.railway.app' : '');

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
