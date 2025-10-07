# Vonix Network Community Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](Dockerfile)
[![Version](https://img.shields.io/badge/version-2.1.0-blue)](package.json)

> A comprehensive Minecraft community platform featuring real-time Discord chat integration, server management, forums, blogs, social features, and a powerful admin dashboard with feature toggles.

![Vonix Network](https://img.shields.io/badge/Status-Production%20Ready-green)

## 🌟 Features

### Core Features
- **🚀 First-Time Setup Wizard**: A beautiful 3-step guided setup for new installations.
- **⚙️ Admin Dashboard**: Comprehensive panel to manage site settings, features, and Discord integration.
- **🎛️ Feature Toggles**: Dynamically enable or disable major site sections in real-time.
- **🤖 Discord Bot Management**: Start, stop, and reload the Discord bot directly from the admin UI.
- **🔐 User Authentication**: Secure, JWT-based authentication with role-based access.
- **💬 Real-time Discord Chat**: Live chat integration on the homepage.
- **🎮 Server Management**: Display Minecraft server status, player counts, and details.
- **📝 Forum System**: Full-featured community forums with moderation tools.
- **📰 Blog Platform**: A complete blog with markdown support.
- **💰 Donation System**: Track donation goals and packages.
- **👥 Social Features**: User profiles and private messaging.

### Technical Highlights
- **⚡ Real-time Updates** - WebSocket connections for instant communication
- **🛡️ Security First** - Helmet.js, rate limiting, input validation, and XSS protection
- **📊 API Documentation** - Interactive Swagger/OpenAPI documentation
- **🔍 Health Monitoring** - Comprehensive health check endpoints
- **📈 Logging & Error Tracking** - Winston logging with optional Sentry integration
- **🐳 Docker Ready** - Production-ready Docker configuration
- **🚀 Performance** - In-memory caching and optimized database queries
- **✅ Testing** - Jest test suite with coverage reports

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Discord Bot** (optional, for chat features)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network

# Run the installation script
# Windows:
install.bat

# Linux/Mac:
chmod +x install.sh
./install.sh
```

### Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:
```env
# Required
PORT=5000
JWT_SECRET=your-secure-secret-here
CLIENT_URL=https://vonix.network

# Optional - Discord integration
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_CHANNEL_ID=your_channel_id
DISCORD_WEBHOOK_URL=your_webhook_url
```

3. Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Start the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:5000`

### First-Time Setup

When you first run the application, you'll be guided through a 3-step setup wizard:

1. **Admin Account Creation** - Create your first administrator account
2. **Discord Configuration** - Optionally configure Discord bot integration  
3. **Review & Complete** - Review your settings and complete setup

After setup, you can access the admin dashboard to manage features and Discord settings.

## 📦 Installation

### Standard Installation

```bash
# 1. Install backend dependencies
npm install

# 2. Install frontend dependencies
cd client && npm install

# 3. Build the frontend
npm run build

# 4. Start the server
npm start
```

### Docker Installation

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development Setup

```bash
# Install all dependencies
npm run install-all

# Start with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## ⚙️ Configuration

### Environment Variables

See [`.env.example`](.env.example) for all available configuration options.

#### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `JWT_SECRET` | Secret key for JWT tokens | _(required)_ |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `https://vonix.network` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot token | _(optional)_ |
| `DISCORD_CHANNEL_ID` | Discord channel for chat | _(optional)_ |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | _(optional)_ |
| `SENTRY_DSN` | Sentry error tracking DSN | _(optional)_ |
| `DATABASE_PATH` | SQLite database path | `./data/vonix.db` |
| `LOG_LEVEL` | Logging level | `info` |
| `CACHE_TTL` | Cache TTL in seconds | `300` |

### Discord Bot Setup

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications)
2. Enable required intents: `Guilds`, `Guild Messages`, `Message Content`
3. Invite bot to your server with proper permissions
4. Add bot token and channel ID to `.env`

For detailed setup instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🎯 Usage

### API Endpoints

The API is accessible at `http://localhost:5000/api`

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

#### Setup & Admin
- `GET /api/setup/status` - Check if setup is required.
- `POST /api/setup/init` - Initialize the first admin account and settings.
- `GET /api/features` - Get public feature flags.
- `GET /api/admin/features` - Get all feature flags (admin only).
- `POST /api/admin/features` - Update feature flags (admin only).
- `GET /api/admin/discord/settings` - Get Discord settings (admin only).
- `POST /api/admin/discord/settings` - Update Discord settings (admin only).
- `POST /api/admin/discord/start|stop|reload` - Manage the Discord bot (admin only).

#### Servers
- `GET /api/servers` - List all servers
- `GET /api/servers/:id` - Get server details
- `GET /api/servers/:id/status` - Get server status

#### Forum
- `GET /api/forum/categories` - List categories
- `GET /api/forum/posts` - List posts
- `POST /api/forum/posts` - Create post
- `PUT /api/forum/posts/:id` - Update post

#### Chat
- `GET /api/chat/messages` - Get chat history
- WebSocket: `ws://localhost:5000/ws/chat` - Real-time chat

For complete API documentation, visit `http://localhost:5000/api-docs`

### Client SDK

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Authentication
const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Get servers
const getServers = async () => {
  const response = await api.get('/servers');
  return response.data;
};
```

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:5000/ws/chat');

ws.onopen = () => {
  console.log('Connected to chat');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('New message:', message);
};
```

## 📚 API Documentation

Interactive API documentation is available at:
- **Local**: http://localhost:5000/api-docs
- **Production**: https://api.vonix.network/api-docs

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)

## 📁 Project Structure

```
vonix-network/
├── client/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable components (SetupWizard, etc.)
│   │   ├── pages/         # Page components (Admin, Setup, etc.)
│   │   ├── services/      # API services
│   │   └── context/       # React context (Auth, Features)
│   └── package.json
├── server/                # Node.js Express backend
│   ├── routes/           # API route handlers (setup, admin, features)
│   ├── middleware/       # Express middleware
│   ├── database/         # Database initialization & models
│   ├── services/         # Business logic (Discord, etc.)
│   ├── utils/            # Utility functions (settings, etc.)
│   └── __tests__/        # Test files
├── data/                 # SQLite database (auto-created)
├── logs/                 # Application logs (auto-created)
├── .env.example          # Environment template
├── docker-compose.yml    # Docker configuration
├── Dockerfile            # Docker build instructions
└── package.json          # Root package.json
```

For detailed structure documentation, see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## 🛠️ Development

### Tech Stack

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Axios** - HTTP client

#### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite (better-sqlite3)** - Database
- **WebSocket (ws)** - Real-time communication
- **Discord.js** - Discord integration
- **JWT** - Authentication
- **Helmet** - Security headers
- **Winston** - Logging

### Available Scripts

```bash
# Development
npm run dev              # Start dev mode with hot reload
npm run server          # Start backend only
npm run client          # Start frontend only

# Production
npm start               # Start production server
npm run build           # Build frontend for production

# Testing
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode

# Utilities
npm run backup          # Backup database
node check-users.js     # Check user accounts
node create-test-user.js # Create test user
```

### Database Management

```bash
# Backup database
npm run backup

# Check users
node check-users.js

# Create test user
node create-test-user.js
```

### Testing

```bash
# Run tests with coverage
npm test

# Watch mode for development
npm run test:watch

# Coverage report
npm test -- --coverage
```

Tests are located in `server/__tests__/` directory.

## 🚢 Deployment

### Docker Deployment (Recommended)

```bash
# 1. Configure environment
cp .env.example .env
nano .env

# 2. Build and start
docker-compose up -d

# 3. View logs
docker-compose logs -f

# 4. Restart services
docker-compose restart

# 5. Stop services
docker-compose down
```

### Manual Deployment

```bash
# 1. Build frontend
cd client && npm run build

# 2. Set production environment
export NODE_ENV=production

# 3. Start with PM2 (recommended)
npm install -g pm2
pm2 start server/index.js --name vonix-network

# 4. Save PM2 configuration
pm2 save
pm2 startup
```

### Environment Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET`
- [ ] Configure `CLIENT_URL` to production domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure Discord bot (if using)
- [ ] Set up error tracking (Sentry)
- [ ] Configure backup strategy
- [ ] Set up monitoring and alerts
- [ ] Review rate limiting configuration
- [ ] Test all endpoints

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## 🔒 Security

- **JWT Authentication** - Secure token-based authentication
- **Rate Limiting** - Prevent abuse and DDoS attacks
- **Helmet.js** - Security headers
- **Input Validation** - Express-validator for all inputs
- **XSS Protection** - DOMPurify sanitization
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Whitelist allowed origins
- **Error Handling** - No sensitive data in error messages

For security policies and reporting vulnerabilities, see [SECURITY.md](SECURITY.md)

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Pull request process
- Coding standards
- Testing requirements

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Express.js** - Web framework
- **React** - UI library
- **Discord.js** - Discord integration
- **better-sqlite3** - Fast SQLite database

## 📞 Support

- **Documentation**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/vonix-network/issues)
- **Discord**: [Join our community](https://discord.gg/vonix)
- **Website**: [vonix.network](https://vonix.network)

## 🗺️ Roadmap

- [ ] Redis integration for distributed caching
- [ ] PostgreSQL support as alternative to SQLite
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Plugin system for extensions
- [ ] Multi-language support (i18n)
- [ ] Advanced moderation tools
- [ ] Integration with more game servers

## 📊 Project Status

Current Version: **2.1.0**

### Completed Features
- ✅ Core features complete
- ✅ Production ready
- ✅ Docker support
- ✅ API documentation
- ✅ Security hardened
- ✅ Test coverage
- ✅ First-time setup wizard
- ✅ Admin dashboard with Discord management
- ✅ Feature toggles system
- ✅ Dynamic configuration
- ✅ Enhanced UI/UX

### Planned Features
- 🚧 Redis caching (v2.2.0)
- 🚧 Mobile app (v3.0.0)
- 🚧 Plugin system (v2.3.0)
- 🚧 Multi-language support (v2.4.0)

---

Made with ❤️ by the Vonix.Network team
