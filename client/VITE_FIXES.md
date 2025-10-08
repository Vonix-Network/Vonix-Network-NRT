# Vite Migration Fixes

## Issue: `process is not defined` Error

### Problem
When migrating from Create React App to Vite, you may encounter:
```
Uncaught ReferenceError: process is not defined
```

### Cause
- **CRA** provides Node.js globals like `process.env` automatically
- **Vite** uses `import.meta.env` instead (more standards-compliant)
- Vite requires explicit type definitions for environment variables

### Solution Applied

#### 1. Updated `src/config/appConfig.ts`
Changed from:
```typescript
process.env.REACT_APP_BRAND_NAME
```

To:
```typescript
import.meta.env.VITE_BRAND_NAME || import.meta.env.REACT_APP_BRAND_NAME
```

This provides **backwards compatibility** - the app will check both prefixes.

#### 2. Created `src/vite-env.d.ts`
Added TypeScript definitions for Vite's environment variables:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BRAND_NAME?: string
  // ... other variables
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

## Environment Variables

### For Vite (Recommended)
Create `.env` file in client directory:
```env
VITE_BRAND_NAME=Vonix.Network
VITE_API_URL=http://localhost:3001/api
VITE_DISCORD_INVITE_URL=https://discord.gg/5GcKfZJ64U
```

### Backwards Compatible (CRA prefix still works)
```env
REACT_APP_BRAND_NAME=Vonix.Network
REACT_APP_API_URL=http://localhost:3001/api
```

Both will work, but `VITE_` prefix is preferred for new projects.

## Other Common Vite Migration Issues

### Issue: Module not found
**Solution**: Check import paths and extensions

### Issue: Public folder assets not loading
**Solution**: In Vite, reference public assets with `/` prefix:
```jsx
// Correct
<img src="/logo.png" />

// Incorrect
<img src="logo.png" />
```

### Issue: `require()` not working
**Solution**: Use ES6 imports instead:
```typescript
// Old (CRA)
const config = require('./config.json')

// New (Vite)
import config from './config.json'
```

## Verification

After applying these fixes:
1. Stop the dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Pages should load correctly
4. No console errors about `process`

## Status
✅ **FIXED** - All environment variables now use Vite's `import.meta.env`
