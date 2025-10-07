// Centralized app configuration reading from environment variables
// CRA exposes env vars prefixed with REACT_APP_
// Types: in some editors, process may not be typed; this declaration avoids IDE red squiggles.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const process: any;

export const BRAND_NAME = process.env.REACT_APP_BRAND_NAME || 'Vonix.Network';
export const SITE_TAGLINE = process.env.REACT_APP_SITE_TAGLINE || 'A thriving Minecraft community';
export const BRAND_SLOGAN = process.env.REACT_APP_BRAND_SLOGAN || 'Welcome to our community';

// API base URL used by axios
export const API_URL =
  process.env.REACT_APP_API_URL || `${window.location.protocol}//${window.location.hostname}:3001/api`;

// Websocket URL for chat
export const WS_URL =
  process.env.REACT_APP_WS_URL || (window.location.protocol === 'https:'
    ? `wss://${window.location.hostname}/ws/chat`
    : `ws://${window.location.hostname}:3001/ws/chat`);

// External links
export const DISCORD_INVITE_URL =
  process.env.REACT_APP_DISCORD_INVITE_URL || 'https://discord.gg/5GcKfZJ64U';

const appConfig = {
  BRAND_NAME,
  SITE_TAGLINE,
  API_URL,
  WS_URL,
  DISCORD_INVITE_URL,
};

export default appConfig;
