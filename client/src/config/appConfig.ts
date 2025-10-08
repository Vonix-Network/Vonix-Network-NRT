// Centralized app configuration reading from environment variables
// Vite exposes env vars prefixed with VITE_ via import.meta.env
// For backwards compatibility, we also check REACT_APP_ prefix

export const BRAND_NAME = import.meta.env.VITE_BRAND_NAME || import.meta.env.REACT_APP_BRAND_NAME || 'Vonix.Network';
export const SITE_TAGLINE = import.meta.env.VITE_SITE_TAGLINE || import.meta.env.REACT_APP_SITE_TAGLINE || 'A thriving Minecraft community';
export const BRAND_SLOGAN = import.meta.env.VITE_BRAND_SLOGAN || import.meta.env.REACT_APP_BRAND_SLOGAN || 'Welcome to our community';

// API base URL used by axios
export const API_URL =
  import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`;

// Websocket URL for chat
export const WS_URL =
  import.meta.env.VITE_WS_URL || import.meta.env.REACT_APP_WS_URL || (window.location.protocol === 'https:'
    ? `wss://${window.location.hostname}/ws/chat`
    : `ws://${window.location.hostname}:3001/ws/chat`);

// External links
export const DISCORD_INVITE_URL =
  import.meta.env.VITE_DISCORD_INVITE_URL || import.meta.env.REACT_APP_DISCORD_INVITE_URL || 'https://discord.gg/5GcKfZJ64U';

const appConfig = {
  BRAND_NAME,
  SITE_TAGLINE,
  API_URL,
  WS_URL,
  DISCORD_INVITE_URL,
};

export default appConfig;
