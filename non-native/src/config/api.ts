/**
 * API Configuration
 * Update these values to match your server deployment
 */

// Server configuration
export const API_CONFIG = {
  // REST API base URL
  BASE_URL: __DEV__ 
    ? "http://10.0.2.2:3000/api"  // Android Emulator
    : "https://your-production-server.com/api",
  
  // WebSocket URL for real-time updates
  WS_URL: __DEV__
    ? "ws://10.0.2.2:3000"  // Android Emulator
    : "wss://your-production-server.com",
  
  // API endpoints
  ENDPOINTS: {
    // Clothing Items
    ITEMS: "/items",
    ITEM_BY_ID: (id: number) => `/items/${id}`,
    
    // Outfits
    OUTFITS: "/outfits",
    OUTFIT_BY_ID: (id: number) => `/outfits/${id}`,
    
    // Sync
    SYNC: "/sync",
  },
  
  // Request timeout (ms)
  TIMEOUT: 10000,
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  
  // WebSocket reconnection
  WS_RECONNECT_DELAY: 5000, // ms
  WS_MAX_RECONNECT_ATTEMPTS: 10,
};

// For development: Use actual device IP instead of emulator localhost
// Example: "http://192.168.1.100:3000/api" when testing on physical device
export const getBaseUrl = () => {
  // You can dynamically change this based on network conditions
  return API_CONFIG.BASE_URL;
};

export const getWebSocketUrl = () => {
  return API_CONFIG.WS_URL;
};

