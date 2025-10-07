# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Two-Factor Authentication (2FA)
- Redis caching integration
- PostgreSQL support
- Plugin system
- Multi-language support (i18n)
- Mobile app (React Native)
- File uploads (avatars, forum attachments)
- OAuth integration (Discord, Google, GitHub)

## [1.1.0] - 2025-10-06

### Added

#### Email System
- **📧 Email Configuration Interface**: SMTP configuration in admin dashboard at `/admin/email`
- **Email Service**: Nodemailer-based email service with support for Gmail, Outlook, SendGrid, Mailgun, and other providers
- **Email Templates**: Pre-built templates for welcome emails, password resets, and forum notifications
- **Test Email Functionality**: Send test emails to verify SMTP configuration
- **Email Notifications**: Automated notifications for forum subscriptions and replies

#### Advanced User Profiles
- **Custom Profile Enhancements**: Support for custom banners, avatar borders, and user titles
- **Achievement Badges System**: Award and display badges to users for accomplishments
- **User Achievements**: Unlockable achievements with rarity levels and point values
- **Activity Statistics**: Comprehensive tracking of topics created, posts, likes received/given, and best answers
- **Reputation System**: Point-based reputation system for user engagement
- **Activity Timeline**: View user's recent posts and topics
- **Profile Stats API**: RESTful API endpoints for profile data, badges, and achievements

#### Enhanced Forum Features
- **Thread Subscriptions**: Subscribe to forum topics with optional email notifications
- **Forum Subscriptions**: Subscribe to entire forums to get notified of new topics
- **Email Notifications for Replies**: Automatic email notifications when subscribed topics receive replies
- **Advanced Forum Search**: Search topics and posts with filters for users, forums, and date ranges
- **Search Sorting**: Sort search results by relevance, date, replies, or views

#### Admin Analytics Dashboard
- **Analytics Overview**: Real-time statistics for users, forums, servers, and blog posts
- **User Activity Graphs**: Visual representation of user registrations and active users over time
- **Forum Activity Graphs**: Charts showing topic and post creation trends
- **Top Users Rankings**: Leaderboards for top users by reputation, posts, and topics created
- **Popular Forums**: Rankings of most active forums by post count
- **Recent Activity Feed**: Live feed of recent user registrations, topics, posts, and blog posts
- **Time Period Filtering**: Filter analytics data by 7, 30, 60, or 90-day periods

#### Database Enhancements
- **New Tables**: `user_badges`, `user_achievements`, `user_activity_stats`
- **User Table Extensions**: Added email, avatar_url, reputation, post_count, last_seen_at columns
- **Profile Extensions**: Added custom_banner, avatar_border, title columns to user_profiles
- **Forum Subscriptions Enhancement**: Added email_notifications toggle
- **Automatic Migrations**: Database migrations run automatically on server startup

#### API Endpoints
- **Email Management**: `/api/admin/email/settings`, `/api/admin/email/test`
- **User Profiles**: `/api/user-profiles/:userId`, `/api/user-profiles/:userId/badges`, `/api/user-profiles/:userId/achievements`
- **Forum Subscriptions**: `/api/forum/subscriptions`, `/api/forum/subscriptions/topic/:topicId`, `/api/forum/subscriptions/forum/:forumId`
- **Forum Search**: `/api/forum/search` with advanced filtering
- **Analytics**: `/api/admin/analytics/overview`, `/api/admin/analytics/user-activity`, `/api/admin/analytics/forum-activity`, `/api/admin/analytics/top-users`

### Changed
- **Admin Dashboard Navigation**: Added Email Settings and Analytics links to admin sidebar
- **Environment Configuration**: Added EMAIL_* environment variables to `.env.example`
- **Admin Routes**: Extended admin dashboard with new email and analytics pages

### Technical
- **Dependencies**: Added `nodemailer@^6.9.7` for email functionality
- **Database Migrations**: Implemented migration system for seamless database updates
- **Performance**: Added indexes for new tables to optimize queries
- **Security**: Email passwords stored securely, admin-only access to sensitive features
- **Logging**: Enhanced logging for email sending and analytics queries

### Documentation
- **IMPLEMENTATION_GUIDE.md**: Comprehensive guide for new features with API documentation
- **ROADMAP_FEATURES_SUMMARY.md**: Quick-start guide and feature summary
- **MOBILE_NAVIGATION_UPDATE.md**: Mobile navigation improvements documentation
- Updated `.env.example` with email configuration options

### Fixed
- **Mobile Navigation Conflict**: Admin hamburger menu now uses unique class names and works independently from main navbar
- **Forum Admin Routes**: Changed route registration from `/api/forum/admin` to `/api/forum-admin` to match frontend
- **Database Migration**: Email column now uses separate unique index instead of inline UNIQUE constraint (SQLite compatibility)
- **Admin Dashboard**: Removed mobile quick actions footer in favor of professional slide-in sidebar menu

### Improved
- **Mobile UX**: Replaced bottom action cards with hamburger menu and slide-in sidebar (industry-standard pattern)
- **Admin Dashboard**: Higher z-index values for admin mobile menu to prevent conflicts
- **Performance**: Cleaner mobile navigation with proper state management and auto-close on route change

## [1.0.0] - 2025-10-06

### Added

#### Core Features & Setup
- **🚀 First-Time Setup Wizard**: A beautiful 3-step guided setup for new installations, including admin creation and optional Discord configuration.
- **🔐 User Authentication**: Secure, JWT-based authentication with role-based access (Admin, User).
- **⚙️ Admin Dashboard**: A comprehensive panel to manage site settings, features, and Discord integration.
- **🎛️ Feature Toggles**: Dynamically enable or disable major site sections (Servers, Forum, Social, Messages, Discord Chat) in real-time.

#### Community & Content
- **💬 Real-time Discord Chat**: Live chat integration on the homepage, powered by a manageable Discord bot.
- **🎮 Server Management**: Display Minecraft server status, player counts, and details.
- **📝 Forum System**: Full-featured community forums with categories, topics, replies, and moderation tools.
- **📰 Blog Platform**: A complete blog with markdown support for news and announcements.
- **💰 Donation System**: Track donation goals and packages.
- **👥 Social Features**: User profiles and private messaging.

#### Technical & Developer Experience
- **🔧 Dynamic Configuration**: Settings and feature flags are stored in the database and managed via the admin panel.
- **🤖 Discord Bot Management**: Start, stop, and reload the Discord bot directly from the admin UI.
- **🎨 Modern Frontend**: A responsive React/TypeScript frontend with a custom feature context for dynamic rendering.
- **🛡️ Security**: Includes Helmet, rate limiting, input validation, and CORS.
- **🐳 Docker Ready**: Comes with `Dockerfile` and `docker-compose.yml` for easy deployment.
- **📊 API Documentation**: Interactive Swagger/OpenAPI documentation available.
- **✅ Testing**: Jest test suite for the backend.

#### Security
- Helmet.js security headers
- Rate limiting on all endpoints
- Input validation with express-validator
- XSS protection with DOMPurify
- CORS configuration
- SQL injection prevention
- Secure error handling

#### Performance
- In-memory caching with node-cache
- Database query optimization
- Connection pooling
- Gzip compression

#### Developer Experience
- Swagger/OpenAPI documentation
- Health check endpoints
- Comprehensive logging with Winston
- Error tracking (Sentry integration)
- Development and production modes
- Hot reload in development

#### Infrastructure
- Docker support with multi-stage builds
- Docker Compose configuration
- Graceful shutdown handling
- Process management ready (PM2)
- Database migrations
- Backup scripts

#### Frontend
- React 18 with TypeScript
- React Router for navigation
- Responsive design
- Real-time WebSocket integration
- Form validation
- Error boundaries

#### Testing
- Jest test suite
- API endpoint tests
- Unit tests
- Test coverage reporting

### Security
- JWT secret validation
- Environment variable validation
- Secure default configurations
- Password strength requirements
- Rate limiting per endpoint type

### Documentation
- Comprehensive README
- API documentation
- Project structure guide
- Contributing guidelines
- Code of conduct
- Security policy
- Deployment guide

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

---

## Release Notes

### Version 1.0.0 - Initial Production Release

This is the first production-ready release of Vonix Network Community Platform. The platform provides a complete solution for managing Minecraft communities with:

- Secure user authentication and authorization
- Real-time Discord chat integration
- Comprehensive server management
- Full-featured forum system
- Blog and content management
- Social networking features
- Admin and moderation tools

**Production Ready Features:**
- ✅ Security hardened
- ✅ Docker deployment ready
- ✅ Comprehensive API documentation
- ✅ Test coverage
- ✅ Error tracking
- ✅ Logging and monitoring
- ✅ Health checks
- ✅ Rate limiting
- ✅ Input validation

**Migration Notes:**
- This is the initial release, no migration required

**Breaking Changes:**
- None

**Known Issues:**
- None

**Upgrade Instructions:**
- This is the initial release

---

## How to Update

### From Source
```bash
# Backup your data
npm run backup

# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
npm run build

# Restart server
pm2 restart vonix-network
```

### Using Docker
```bash
# Backup your data first
docker-compose exec vonix-backend npm run backup

# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

---

## Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

---

## Links

- [GitHub Repository](https://github.com/yourusername/vonix-network)
- [Documentation](README.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Issue Tracker](https://github.com/yourusername/vonix-network/issues)
- [Releases](https://github.com/yourusername/vonix-network/releases)

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
