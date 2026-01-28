// API configuration for axios
import axios from 'axios';

// Use environment variable if set (for production), otherwise use relative paths (for development)
const baseURL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
