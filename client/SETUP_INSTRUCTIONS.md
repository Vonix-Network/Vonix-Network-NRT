# 🎮 Quick Setup Instructions

## Prerequisites
- Node.js 18+ and npm 9+
- Git (optional, for version control)

## Installation (3 Steps)

### Step 1: Navigate to Client Directory
```bash
cd client
```

### Step 2: Install Dependencies
```bash
# Remove old dependencies (if exists)
rm -rf node_modules package-lock.json

# Install fresh dependencies
npm install
```

This will install:
- Vite 5.0 (build tool)
- React 18.2 (framework)
- Tailwind CSS 3.4 (styling)
- TypeScript 5.3 (type checking)
- And all other dependencies

### Step 3: Start Development Server
```bash
npm run dev
```

The application will start on **http://localhost:3000**

## Available Commands

```bash
# Start development server (with HMR)
npm run dev
npm start        # Alternative

# Build for production
npm run build

# Build for development (with source maps)
npm run build:dev

# Preview production build
npm run preview
```

## What to Expect

### Development Server
- Vite dev server starts in ~1-2 seconds
- Instant hot module replacement (HMR)
- Fast page refreshes
- Console shows build status

### First Load
You'll see the redesigned Vonix Network with:
- **Dark gaming theme** - Deep charcoal backgrounds
- **Bright green accents** - Gaming green (#00d97e)
- **Modern UI** - Clean, professional design
- **All features working** - Zero breaking changes

## Verification Checklist

After starting the dev server, verify:
- [ ] Homepage loads with "Join the Ultimate Minecraft Community"
- [ ] Navigation bar has green accents
- [ ] Buttons have green hover effects
- [ ] All pages load correctly
- [ ] Console has no errors

## Common Issues & Solutions

### Issue: `npm install` fails
**Solution**: 
```bash
# Update npm
npm install -g npm@latest

# Try again
npm install
```

### Issue: Port 3000 in use
**Solution**:
```bash
# Kill the process or change port in vite.config.ts
# Update server.port to 3001 or any available port
```

### Issue: TypeScript errors
**Solution**: These are expected until dependencies install. Run:
```bash
npm install
```

### Issue: `@tailwind` CSS warnings
**Solution**: These warnings are normal - Tailwind directives are valid

### Issue: Module not found errors
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json node_modules/.vite
npm install
```

## Production Build

To create a production build:

```bash
npm run build
```

This will:
1. Run TypeScript type checking
2. Build optimized production bundle
3. Output to `build/` directory
4. Ready for deployment

## File Structure

After installation, your client directory should have:
```
client/
├── node_modules/          # Dependencies (installed)
├── public/                # Static assets
├── src/                   # Source code
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── context/           # React context
│   ├── config/            # Configuration
│   ├── App.tsx            # Main app component
│   ├── index.tsx          # Entry point
│   └── index.css          # Global styles (with Tailwind)
├── index.html             # HTML template (root)
├── package.json           # Dependencies & scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
├── tsconfig.json          # TypeScript configuration
└── MIGRATION_GUIDE.md     # Detailed migration docs
```

## Theme Preview

### Colors You'll See
- **Backgrounds**: Dark charcoal (#0f151b to #242d38)
- **Accents**: Bright green (#00d97e)
- **Text**: White (#ffffff) and gray (#9ca3af)
- **Effects**: Green glows on hover

### Pages Themed
✅ Homepage - Hero section with green gradient  
✅ Navbar - Green logo and active links  
✅ Admin Dashboard - Green sidebar accents  
✅ Leaderboard - Green reputation scores  
✅ Login/Register - Green buttons  
✅ Server Pages - Consistent theme  
✅ Blog - Clean typography  
✅ Forums - Modern card design  
✅ Profile Pages - User-friendly layout  

## Need Help?

1. **Read the docs**:
   - `MIGRATION_GUIDE.md` - Detailed technical guide
   - `REDESIGN_SUMMARY.md` - Complete redesign overview

2. **Check Vite docs**: https://vitejs.dev
3. **Check Tailwind docs**: https://tailwindcss.com

## Next Steps

1. ✅ Run `npm install`
2. ✅ Run `npm run dev`
3. 🎉 Explore the redesigned interface
4. 🚀 Build features with Vite + Tailwind

---

**Congratulations!** You're now running Vonix Network with the new Minecraft gaming theme, powered by Vite and Tailwind CSS. 🎮
