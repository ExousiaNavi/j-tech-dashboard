// FOR DEVELOPMENT
// export const API_URL = import.meta.env.VITE_API_URL as string;
// export const WS_URL = import.meta.env.VITE_WS_URL as string;

// FOR PRODUCTION
const hostname = window.location.hostname;
export const API_URL = `http://${hostname}:8000`;
export const WS_URL = `ws://${hostname}:8000`;

