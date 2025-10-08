# Changelog

All notable changes to the Vonix Network Community Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **🎨 Complete Admin Dashboard Retheme**: Major visual overhaul with dark gaming theme and modern UI elements
- **✨ Enhanced Section Headers**: Redesigned all admin section headers with gradient text effects and green accent bars
- **🏷️ Professional Status Badges**: Complete redesign of server status indicators with proper styling and animations
- **📝 Streamlined Blog Workflow**: Added admin "New Post" button directly on blog page for improved content creation
- **🔧 Advanced Blog Validation**: Comprehensive client-side validation with detailed server error messages and debugging
- **🛡️ Security & Git Improvements**: Updated .gitignore to exclude database files and sensitive data from version control
- **📱 Mobile UI Enhancements**: Responsive design improvements across all admin components

### Changed
- **Complete Visual Identity**: Transformed admin dashboard from light theme to professional dark gaming theme
- **Typography System**: Implemented gradient text effects (white-to-green) for all section titles with icon separation
- **Color Scheme**: Unified green accent color system across all admin components and status indicators
- **Navigation UX**: Blog creation workflow streamlined - admins can create posts without navigating to dashboard
- **Error Communication**: Blog post creation now displays specific validation errors instead of generic failure messages
- **Homepage Layout**: Removed chat statistics section (500+ Active Players, 24/7 Live Support, ∞ Fun & Games) from live community chat area
- **Badge Design Language**: Transformed circular badges to professional rectangular design with hover effects

### Fixed
- **Critical Status Badge Issues**: Resolved App.css conflicts causing circular badges instead of proper rectangular status indicators
- **CSS Architecture Problems**: Fixed specificity conflicts between AdminDashboard.css and App.css affecting badge styling
- **Blog Post Validation Failures**: Enhanced error parsing to extract and display specific server validation details from API responses
- **Mobile Layout Issues**: Improved responsive design for section headers and admin components on smaller screens
- **Form Submission Problems**: Added proper data sanitization and validation to prevent common blog post creation errors

### Technical
- **CSS Specificity Management**: Implemented targeted selectors with !important flags to override conflicting global styles
- **Error Handling Architecture**: Added comprehensive debug logging and multi-level error message parsing for API responses
- **Data Sanitization Pipeline**: Enhanced form data cleaning with null handling and type conversion for API submissions
- **Responsive Design System**: Improved mobile-first CSS with proper breakpoints and touch-friendly interactions
- **Git Security Protocol**: Comprehensive .gitignore update to exclude database files, environment variables, and build artifacts
- **Component Architecture**: Separated icon and text elements in section headers for better styling control and consistency

### Planned
- Two-Factor Authentication (2FA)
- Redis caching integration
- PostgreSQL support
- Plugin system
- Multi-language support (i18n)
- Mobile app (React Native)
- File uploads (avatars, forum attachments)
- OAuth integration (Discord, Google, GitHub)

## [1.1.1] - 2025-01-07

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
- **Reputation System**: Automatic point-based reputation system with 6 tiers (Newcomer, Rising Star, Respected, Veteran, Expert, Legend)
- **Reputation Awards**: Automatic reputation points for creating topics (+5), posts (+2), and likes (+3)
- **🏆 Public Reputation Leaderboard**: Interactive leaderboard page with top 3 podium display and full rankings table
- **Reputation Badges**: Visual badges displaying reputation tier with icons and colors
- **Reputation History**: Complete logging of all reputation changes with reasons
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
- **New Tables**: `user_badges`, `user_achievements`, `user_activity_stats`, `user_reputation_log`
- **User Table Extensions**: Added email (unique index), avatar_url, reputation, post_count, last_seen_at columns
- **Profile Extensions**: Added custom_banner, avatar_border, title columns to user_profiles
- **Forum Subscriptions Enhancement**: Added email_notifications toggle
- **Automatic Migrations**: Database migrations run automatically on server startup (SQLite compatible)

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
- **README.md**: Updated with v1.1.0 features, email configuration, and API endpoints
- **CHANGELOG.md**: Complete v1.1.0 release notes
- Updated `.env.example` with email configuration options

### Fixed

#### v1.1.1 Hotfixes (January 2025)
- **🔧 Forum Moderation Routes**: Fixed missing `verifyToken` import causing server startup errors in forum-moderation.js
- **📊 Forum Count Accuracy**: Fixed negative topic/post counts when deleting content via admin dashboard using `MAX(0, ...)` protection
- **⚡ Cache Invalidation**: New posts and topics now appear immediately without server reload - added automatic cache clearing on content creation/deletion
- **🕒 Last Post Timestamps**: Fixed "Just now" display issue - now shows accurate timestamps by refreshing stale last post data
- **🔗 Leaderboard Profile Links**: Fixed user profile links in reputation leaderboard to correctly route to `/users/:id` instead of `/profile/:id`
- **🗑️ Optimistic UI Updates**: Comment and post deletions now provide instant visual feedback with automatic rollback on errors
- **🎯 Database Integrity**: Added comprehensive protection against negative counts in all forum deletion operations

#### v1.1.0 Original Fixes
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
