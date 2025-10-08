/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite prefixed variables
  readonly VITE_BRAND_NAME?: string
  readonly VITE_SITE_TAGLINE?: string
  readonly VITE_BRAND_SLOGAN?: string
  readonly VITE_API_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_DISCORD_INVITE_URL?: string
  
  // Backwards compatibility with CRA (REACT_APP_ prefix)
  readonly REACT_APP_BRAND_NAME?: string
  readonly REACT_APP_SITE_TAGLINE?: string
  readonly REACT_APP_BRAND_SLOGAN?: string
  readonly REACT_APP_API_URL?: string
  readonly REACT_APP_WS_URL?: string
  readonly REACT_APP_DISCORD_INVITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
