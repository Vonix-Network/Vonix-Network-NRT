# Vonix Network Community Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](Dockerfile)
[![Version](https://img.shields.io/badge/version-1.2.0-blue)](package.json)

> A comprehensive Minecraft community platform featuring real-time Discord chat integration, server management, forums, blogs, social features, and a powerful admin dashboard with feature toggles.

![Vonix Network](https://img.shields.io/badge/Status-Production%20Ready-green)

## 🌟 Features

### Core Features
- **🚀 First-Time Setup Wizard**: A beautiful 3-step guided setup for new installations.
- **⚙️ Admin Dashboard**: Comprehensive panel to manage site settings, features, and Discord integration.
- **🎛️ Feature Toggles**: Dynamically enable or disable major site sections in real-time.
- **🤖 Discord Bot Management**: Start, stop, and reload the Discord bot directly from the admin UI.
- **🔐 User Authentication**: Secure, JWT-based authentication with role-based access.
- **🎮 Minecraft Registration System**: In-game registration with secure code generation for seamless player onboarding.
- **💬 Real-time Discord Chat**: Live chat integration on the homepage.
- **🎮 Server Management**: Display Minecraft server status, player counts, and details.
- **📝 Forum System**: Full-featured community forums with moderation tools.
- **📰 Blog Platform**: A complete blog with markdown support.
- **💰 Donation System**: Track donation goals and packages.
- **👥 Social Features**: User profiles, private messaging, stories, friend system, groups, and events.

### 🆕 New in v1.2.0 - Social Platform & Security Overhaul
- **🌐 Complete Social Platform**: Facebook-like social features with posts, comments, reactions, and sharing
- **📖 Stories System**: 24-hour ephemeral stories with custom backgrounds and view tracking
- **👫 Advanced Friend System**: Send/accept friend requests, friend discovery, and friend-only content feeds
- **🎉 Groups & Events**: Create and join social groups, organize community events with RSVP functionality
- **🔒 Enhanced Security**: Rate limiting, input validation, XSS protection, and SQL injection prevention
- **⚡ Database Optimization**: Advanced indexing, query optimization, and performance improvements
- **🎨 Minecraft Green Theme**: Consistent green accent theme across the entire platform
- **📱 Mobile-First Design**: Responsive social features optimized for all device sizes
- **🛡️ Content Sanitization**: DOMPurify integration for safe user-generated content
- **📊 Social Analytics**: Track engagement, popular content, and user interactions

### 🎨 Major Visual Overhaul & Retheme
- **🌟 Complete Admin Dashboard Retheme**: Transformed from light theme to professional dark gaming aesthetic with modern UI elements
- **✨ Advanced Typography System**: Gradient text effects (white-to-green) with separated icon and text elements for better visual hierarchy
- **🏷️ Professional Status Badge Redesign**: Fixed critical styling conflicts and implemented rectangular badges with hover animations
- **🎮 Unified Gaming Color Scheme**: Consistent green accent system across all admin components and status indicators
- **📝 Enhanced Content Creation Workflow**: Streamlined blog management with direct admin access from blog page
- **🔧 Advanced Error Handling System**: Comprehensive validation with detailed server error parsing and debug logging
- **📱 Mobile-First Responsive Design**: Complete mobile optimization with touch-friendly interactions and proper breakpoints
- **🛡️ Security & Development Improvements**: Enhanced .gitignore, CSS architecture fixes, and data sanitization pipeline

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
- [Security](#-security)
- [Troubleshooting](#-troubleshooting)
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
| `EMAIL_ENABLED` | Enable email features (0 or 1) | `0` |
| `EMAIL_HOST` | SMTP server hostname | _(optional)_ |
| `EMAIL_PORT` | SMTP port (587 or 465) | `587` |
| `EMAIL_SECURE` | Use SSL (1) or TLS (0) | `0` |
| `EMAIL_USER` | SMTP username | _(optional)_ |
| `EMAIL_PASS` | SMTP password | _(optional)_ |
| `EMAIL_FROM` | From email address | _(optional)_ |
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

### Minecraft Registration System

The platform includes a built-in registration system that allows players to register accounts directly from in-game using a Minecraft mod/plugin.

#### How It Works

1. **Player initiates registration in-game** - Player types a command like `/register`
2. **Mod/Plugin requests code** - POST request to `/api/registration/generate-code` with player's username and UUID
3. **Player receives code** - A 6-character code valid for 10 minutes is generated
4. **Player completes registration** - Player visits the website and enters the code with their desired password
5. **Account created** - User account is automatically linked to their Minecraft UUID

#### API Integration Example

```javascript
// Minecraft mod/plugin makes this request
POST /api/registration/generate-code
Content-Type: application/json
X-API-Key: your-registration-api-key-here

{
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "12345678-1234-1234-1234-123456789abc"
}

// Response
{
  "code": "ABC123",
  "expires_in": 600,
  "minecraft_username": "PlayerName"
}

// Error responses (401/403)
{
  "error": "API key required",
  "message": "Please provide X-API-Key header"
}
```

#### Security Features

- **🔐 API Key Protection**: Requires authentication via `X-API-Key` header (auto-generated during setup)
- **Secure Code Generation**: Cryptographically secure 6-character codes
- **Time-Limited**: Codes expire after 10 minutes
- **One-Time Use**: Each code can only be used once
- **UUID Validation**: Prevents duplicate accounts per Minecraft account
- **Password Requirements**: Enforces minimum 6 characters with letters and numbers
- **Rate Limiting**: Prevents abuse with configurable limits per IP

#### For Mod/Plugin Developers

To integrate with your Minecraft server:

1. **Get your API key** from Admin Dashboard > Registration Settings
2. **Store the API key** securely in your mod/plugin configuration
3. Send POST request to `/api/registration/generate-code` when player types `/register`
   - Include `X-API-Key` header with your API key
4. Display the generated code to the player in-game
5. Optionally, provide a clickable link to your website's registration page
6. Codes are automatically cleaned up after expiration or use

**Example Minecraft mod/plugin code:**
```java
// Java example for Minecraft Forge/Fabric
String apiKey = config.getRegistrationApiKey();
String apiUrl = "https://api.vonix.network/api/registration/generate-code";

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create(apiUrl))
    .header("Content-Type", "application/json")
    .header("X-API-Key", apiKey)
    .POST(HttpRequest.BodyPublishers.ofString(
        String.format("{\"minecraft_username\":\"%s\",\"minecraft_uuid\":\"%s\"}", 
            playerName, playerUUID)
    ))
    .build();
```

**Example response to player:**
```
Your registration code is: ABC123
Visit https://vonix.network/register and enter this code
Code expires in 10 minutes
```

**Admin Dashboard:**
- View current API key (never exposed in logs)
- Regenerate API key if compromised
- View registration statistics
- Monitor recent registrations

## 🎯 Usage

### API Endpoints

The API is accessible at `http://localhost:5000/api`

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

#### Minecraft Registration (In-Game)
- `POST /api/registration/generate-code` - Generate registration code (called by Minecraft mod/plugin)
- `POST /api/registration/register` - Complete registration with code
- `GET /api/registration/check-code/:code` - Validate registration code
- `GET /api/registration/stats` - Get registration statistics

#### Setup & Admin
- `GET /api/setup/status` - Check if setup is required.
- `POST /api/setup/init` - Initialize the first admin account and settings.
- `GET /api/features` - Get public feature flags.
- `GET /api/admin/features` - Get all feature flags (admin only).
- `POST /api/admin/features` - Update feature flags (admin only).
- `GET /api/admin/discord/settings` - Get Discord settings (admin only).
- `POST /api/admin/discord/settings` - Update Discord settings (admin only).
- `POST /api/admin/discord/start|stop|reload` - Manage the Discord bot (admin only).
- `GET /api/admin/registration/api-key` - Get registration API key (admin only).
- `POST /api/admin/registration/regenerate-key` - Regenerate API key (admin only).
- `GET /api/admin/registration/stats` - Get detailed registration statistics (admin only).
- `GET /api/admin/email/settings` - Get email configuration (admin only).
- `POST /api/admin/email/settings` - Update email settings (admin only).
- `POST /api/admin/email/test` - Send test email (admin only).
- `GET /api/admin/analytics/overview` - Get analytics overview (admin only).
- `GET /api/admin/analytics/user-activity` - Get user activity trends (admin only).
- `GET /api/admin/analytics/forum-activity` - Get forum activity trends (admin only).

#### Servers
- `GET /api/servers` - List all servers
- `GET /api/servers/:id` - Get server details
- `GET /api/servers/:id/status` - Get server status

#### Users
- `GET /api/users` - List all users (admin only)
- `GET /api/users/me` - Get current user info
- `GET /api/users/discover` - Get users for discovery
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

#### Blog
- `GET /api/blog` - List published blog posts
- `GET /api/blog/:id` - Get single blog post
- `POST /api/blog` - Create blog post (admin only)
- `PUT /api/blog/:id` - Update blog post (admin only)
- `DELETE /api/blog/:id` - Delete blog post (admin only)

#### Forum
- `GET /api/forum/categories` - List categories
- `GET /api/forum/posts` - List posts
- `GET /api/forum/posts/:id` - Get single post
- `POST /api/forum/posts` - Create post
- `PUT /api/forum/posts/:id` - Update post
- `DELETE /api/forum/posts/:id` - Delete post
- `POST /api/forum/posts/:id/comments` - Add comment
- `POST /api/forum/posts/:id/like` - Like/unlike post
- `POST /api/forum/posts/:id/pin` - Pin post (moderator)
- `POST /api/forum/posts/:id/lock` - Lock post (moderator)

#### Private Messages
- `GET /api/messages/search-users` - Search users for messaging
- `GET /api/messages/conversations` - Get conversation list
- `GET /api/messages/:userId` - Get messages with specific user
- `POST /api/messages/:userId` - Send message to user
- `PUT /api/messages/:messageId/read` - Mark message as read
- `DELETE /api/messages/:messageId` - Delete message

#### User Profiles (Enhanced)
- `GET /api/user-profiles/:userId` - Get profile with stats, badges, and achievements
- `PUT /api/user-profiles/:userId` - Update user profile
- `POST /api/user-profiles/:userId/badges` - Award badge (admin only)
- `POST /api/user-profiles/:userId/achievements` - Grant achievement (admin only)
- `GET /api/user-profiles/:userId/activity` - Get user activity timeline

#### Forum Subscriptions
- `GET /api/forum/subscriptions` - Get user's subscriptions
- `POST /api/forum/subscriptions/topic/:topicId` - Subscribe to topic
- `DELETE /api/forum/subscriptions/topic/:topicId` - Unsubscribe from topic
- `POST /api/forum/subscriptions/forum/:forumId` - Subscribe to forum
- `DELETE /api/forum/subscriptions/forum/:forumId` - Unsubscribe from forum
- `GET /api/forum/search` - Advanced forum search with filters

#### Social Features
- `GET /api/social/profile/:userId` - Get user profile with friend status
- `PUT /api/social/profile` - Update user profile
- `POST /api/social/posts` - Create a new post
- `GET /api/social/feed` - Get personalized feed (friends + own posts)
- `GET /api/social/posts/user/:userId` - Get user's posts
- `DELETE /api/social/posts/:postId` - Delete post (own or admin)
- `POST /api/social/posts/:postId/like` - Like/unlike post
- `POST /api/social/posts/:postId/react` - Add reaction to post
- `GET /api/social/posts/:postId/comments` - Get post comments
- `POST /api/social/posts/:postId/comments` - Add comment to post
- `DELETE /api/social/comments/:commentId` - Delete comment
- `POST /api/social/comments/:commentId/like` - Like/unlike comment
- `POST /api/social/follow/:userId` - Follow/unfollow user
- `GET /api/social/followers/:userId` - Get user's followers
- `GET /api/social/following/:userId` - Get who user follows

#### Stories
- `GET /api/social/stories` - Get stories from friends
- `POST /api/social/stories` - Create a new story
- `POST /api/social/stories/:storyId/view` - Mark story as viewed

#### Friend System
- `GET /api/social/friends` - Get user's friends list
- `GET /api/social/friend-requests` - Get pending friend requests
- `POST /api/social/friend-request` - Send friend request
- `POST /api/social/friend-request/respond` - Accept/decline friend request
- `GET /api/social/suggested-friends` - Get friend suggestions

#### Groups & Events
- `GET /api/social/groups` - Get user's groups
- `POST /api/social/groups` - Create new group
- `GET /api/social/groups/:groupId` - Get group details
- `POST /api/social/groups/:groupId/join` - Join group
- `POST /api/social/groups/:groupId/leave` - Leave group
- `GET /api/social/events` - Get user's events
- `POST /api/social/events` - Create new event
- `GET /api/social/events/:eventId` - Get event details
- `POST /api/social/events/:eventId/attend` - Attend event
- `POST /api/social/events/:eventId/unattend` - Unattend event

#### Donations
- `GET /api/donations/public` - Get public donations list
- `GET /api/donations` - Get all donations (admin only)
- `POST /api/donations` - Record donation (admin only)
- `PUT /api/donations/:id` - Update donation (admin only)
- `DELETE /api/donations/:id` - Delete donation (admin only)

#### Chat
- `GET /api/chat/messages` - Get chat history
- WebSocket: `ws://localhost:5000/ws/chat` - Real-time chat

#### Health & Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- Includes database, Discord bot, WebSocket, and cache statistics

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

### Authentication & Authorization
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Role-Based Access Control** - Admin, moderator, and user roles with granular permissions
- **Session Management** - Secure session handling with automatic expiration

### Input Protection
- **Rate Limiting** - Multi-tier rate limiting (general: 1000/5min, auth: 2000/5min, posts: 15/15min, comments: 20/5min, friend requests: 25/hour)
- **Input Validation** - Express-validator with comprehensive validation rules
- **Content Sanitization** - DOMPurify integration to prevent XSS attacks
- **Length Limits** - Enforced character limits (posts: 2000, comments: 1000, bio: 500)

### Data Protection
- **SQL Injection Protection** - Parameterized queries with better-sqlite3
- **XSS Prevention** - Content sanitization with allowed HTML tags only
- **CSRF Protection** - Cross-site request forgery prevention
- **Helmet.js** - Comprehensive security headers

### Infrastructure Security
- **CORS Configuration** - Whitelist allowed origins with dynamic configuration
- **Error Handling** - Sanitized error messages without sensitive data exposure
- **Database Security** - WAL mode, proper indexing, and connection pooling
- **Content Security Policy** - Strict CSP headers for XSS prevention

### Monitoring & Logging
- **Security Logging** - Winston logging with security event tracking
- **Error Tracking** - Optional Sentry integration for production monitoring
- **Health Checks** - Comprehensive system health monitoring

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

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: 
- Verify `CLIENT_URL` in `.env` matches your frontend domain
- Restart the server after changing CORS settings
- Check server logs for blocked origins

#### Database Locked Error
```
SQLITE_BUSY: database is locked
```
**Solution**: 
- SQLite uses WAL mode by default for better concurrency
- Ensure no other processes are accessing the database
- Check file permissions on `data/vonix.db`

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: 
```bash
# Find process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>
```

#### Discord Bot Not Connecting
**Solution**: 
- Verify bot token in `.env` is correct
- Check bot has required intents enabled in Discord Developer Portal
- Ensure bot is invited to your server
- Check server logs for specific error messages

#### 500 Internal Server Error on User Creation
**Solution**: 
- Check if database has been initialized properly
- Verify all required environment variables are set
- Check server logs for specific error messages
- Ensure `getDatabase()` is properly imported in routes

#### Registration Codes Not Working
**Solution**: 
- Codes expire after 10 minutes
- Each code is one-time use only
- Check database has `registration_codes` table
- Verify system clock is correct (codes use timestamps)

### Database Information

#### Tables Created on Initialization
- `users` - User accounts with Minecraft linking
- `servers` - Minecraft server information
- `blog_posts` - Blog content
- `forum_categories` - Forum structure
- `forum_posts` - Forum posts and threads
- `forum_comments` - Forum post comments
- `chat_messages` - Discord chat history
- `donations` - Donation tracking
- `private_messages` - User-to-user messages
- `follows` - Social following relationships
- `registration_codes` - Minecraft registration codes

#### Database Backup & Restore
```bash
# Backup (creates timestamped backup in backups/)
npm run backup

# Manual backup
cp data/vonix.db backups/vonix-backup-$(date +%Y%m%d).db

# Restore from backup
cp backups/vonix-backup-YYYYMMDD.db data/vonix.db
```

### Rate Limiting

Default rate limits (configurable in `server/index.js`):
- **General API**: 200 requests per 5 minutes
- **Authentication**: 10 login attempts per 15 minutes per IP
- **Registration**: 5 code generations per hour per IP

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

Current Version: **1.2.0**

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
- ✅ Email system with SMTP configuration
- ✅ Advanced user profiles with badges
- ✅ Forum subscriptions and search
- ✅ Analytics dashboard
- ✅ Complete social platform (v1.2.0)
- ✅ Stories system (v1.2.0)
- ✅ Friend system with requests (v1.2.0)
- ✅ Groups and events (v1.2.0)
- ✅ Enhanced security measures (v1.2.0)
- ✅ Database optimization (v1.2.0)
- ✅ Minecraft green theme (v1.2.0)

### Recently Added (v1.2.0)
- ✅ Facebook-like social platform with posts, comments, and reactions
- ✅ 24-hour stories with custom backgrounds and view tracking
- ✅ Advanced friend system with discovery and suggestions
- ✅ Social groups and community events with RSVP
- ✅ Comprehensive security overhaul with rate limiting and input validation
- ✅ Database performance optimization with advanced indexing
- ✅ Consistent Minecraft green theme across all components
- ✅ Mobile-first responsive design for social features

### Planned Features
- 🚧 Two-Factor Authentication (v1.3.0)
- 🚧 File uploads and media sharing (v1.3.0)
- 🚧 Real-time notifications (v1.3.0)
- 🚧 Redis caching (v1.4.0)
- 🚧 Mobile app (v2.0.0)
- 🚧 Plugin system (v2.0.0)
- 🚧 Multi-language support (v2.0.0)

---

Made with ❤️ by the Vonix.Network team
