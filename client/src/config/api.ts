// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';
export const API_URL = `${API_BASE_URL}/api`;

// WebSocket URL
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, 'ws');

console.log('API Configuration:', {
  API_BASE_URL,
  API_URL,
  WS_BASE_URL
});
