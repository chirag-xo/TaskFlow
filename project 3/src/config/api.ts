// API configuration
// Vite automatically loads environment variables prefixed with VITE_
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Debug: Log the current environment and URLs (remove in production)
console.log('Environment:', import.meta.env.MODE);
console.log('API URL:', API_BASE_URL);
console.log('Socket URL:', SOCKET_URL);