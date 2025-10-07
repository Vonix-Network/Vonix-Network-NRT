# Quick Start Guide

Get Vonix Network up and running in minutes!

## 🚀 Fast Track (5 Minutes)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network
npm run install-all
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set these **required** values:
```env
JWT_SECRET=your-super-secret-jwt-key-here
CLIENT_URL=http://localhost:3000
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Development

```bash
npm run dev
```

✅ **Done!** 
- Backend: http://localhost:5000
- Frontend: http://localhost:3000
- API Docs: http://localhost:5000/api-docs

---

## 📦 Docker Quick Start (Even Faster!)

```bash
# 1. Clone
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network

# 2. Configure
cp .env.example .env
# Edit .env with your JWT_SECRET

# 3. Start
docker-compose up -d

# 4. View logs
docker-compose logs -f
```

Application running at http://localhost:5000 🎉

---

## 🎯 First Steps

### Create Admin User

```bash
node create-test-user.js
```

Follow prompts to create your admin account.

### Check Health

```bash
npm run health-check
```

All services should show ✓ OK.

### Explore API

Visit http://localhost:5000/api-docs for interactive API documentation.

---

## 📚 Next Steps

### Add Discord Bot (Optional)

1. Create bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Copy bot token
3. Add to `.env`:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_CHANNEL_ID=your_channel_id
   ```
4. Restart: `npm run dev`

### Production Deployment

Ready to deploy? See [DEPLOYMENT.md](DEPLOYMENT.md) for complete guide.

Quick production:
```bash
# Build
npm run build

# Start with PM2
npm install -g pm2
npm run pm2:start

# Or Docker
npm run docker:prod
```

---

## 🔧 Useful Commands

```bash
# Development
npm run dev              # Start dev mode
npm run server           # Backend only
npm run client           # Frontend only

# Production
npm start                # Start production
npm run build            # Build frontend

# Testing
npm test                 # Run tests
npm run health-check     # Check services

# Database
npm run backup           # Backup database
npm run backup:list      # List backups

# Docker
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs

# PM2
npm run pm2:start        # Start with PM2
npm run pm2:logs         # View logs
npm run pm2:monit        # Monitor
```

---

## ❓ Troubleshooting

### Port already in use?

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Database errors?

```bash
# Reset database
rm -rf data/
# Restart application (will recreate)
npm run dev
```

### Build fails?

```bash
# Clean and reinstall
rm -rf node_modules client/node_modules
npm run install-all
```

### Still stuck?

- Check [README.md](README.md)
- Review [DEPLOYMENT.md](DEPLOYMENT.md)
- Open [GitHub Issue](https://github.com/yourusername/vonix-network/issues)

---

## 🎮 Default Access

After creating test user with `create-test-user.js`:

- **Username**: (your choice)
- **Password**: (your choice)
- **Role**: Admin

Login at: http://localhost:3000/login

---

## 📊 What's Included?

✅ User authentication  
✅ Real-time Discord chat  
✅ Minecraft server management  
✅ Forum system  
✅ Blog platform  
✅ Admin panel  
✅ API documentation  
✅ Docker support  

---

## 🔗 Important URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/health

---

## 💡 Pro Tips

1. **Use Docker** for easiest setup
2. **Generate strong JWT secret** for production
3. **Enable Discord** for live chat
4. **Run health checks** regularly
5. **Backup database** before updates

---

## 🚀 Ready to Customize?

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines!

---

**Need more details?** Check the [full README](README.md) 📖
