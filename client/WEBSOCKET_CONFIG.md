# WebSocket Configuration for Vite

## Issue Fixed
WebSockets weren't working because Vite needs explicit proxy configuration for WebSocket connections.

## Solution Applied

### 1. Updated `vite.config.ts`
Added WebSocket proxy configuration:
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
    '/ws': {
      target: 'ws://localhost:5000',  // WebSocket target
      ws: true,                        // Enable WebSocket proxy
      changeOrigin: true,
    },
  },
}
```

### 2. Updated `.env`
Added WebSocket URL configuration:
```env
VITE_WS_URL=ws://localhost:3000/ws/chat
```

## How It Works

**Development Mode:**
- Client connects to: `ws://localhost:3000/ws/chat`
- Vite proxies to: `ws://localhost:5000/ws/chat`
- Server handles WebSocket at port 5000

**Production Mode:**
The `appConfig.ts` automatically handles production URLs:
```typescript
export const WS_URL =
  import.meta.env.VITE_WS_URL || 
  (window.location.protocol === 'https:'
    ? `wss://${window.location.hostname}/ws/chat`
    : `ws://${window.location.hostname}:3001/ws/chat`);
```

## Testing WebSockets

### 1. Restart Dev Server
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 2. Check Console
Look for WebSocket connection logs in browser console

### 3. Test Live Chat
Navigate to pages with live chat features to verify connection

## Production Configuration

For production, ensure your reverse proxy (nginx/Apache) is configured to handle WebSocket upgrades:

### Nginx Example
```nginx
location /ws/ {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

## Environment Variables

### Development (.env)
```env
VITE_WS_URL=ws://localhost:3000/ws/chat
```

### Production (.env.production)
```env
VITE_WS_URL=wss://yourdomain.com/ws/chat
```

## Troubleshooting

### Issue: WebSocket connection refused
**Check:**
1. Backend server is running on port 5000
2. WebSocket endpoint exists at `/ws/chat`
3. Firewall allows WebSocket connections

### Issue: Connection drops immediately
**Check:**
1. CORS configuration on backend
2. WebSocket upgrade headers
3. Server logs for errors

### Issue: Works in dev but not production
**Check:**
1. Production WebSocket URL is correct
2. Reverse proxy WebSocket configuration
3. SSL/TLS for wss:// connections

## Status
✅ WebSocket proxy configured in Vite
✅ Environment variable added
✅ Ready for testing
