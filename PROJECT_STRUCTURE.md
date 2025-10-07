# Project Structure

This document provides a detailed overview of the Vonix Network project structure, explaining the purpose and organization of each directory and major file.

## 📁 Root Directory

```
vonix-network-2.1/
├── client/                 # React TypeScript frontend application
├── server/                 # Node.js Express backend application
├── data/                   # SQLite database storage (auto-created)
├── logs/                   # Application logs (auto-created)
├── backups/                # Database backups (auto-created)
├── scripts/                # Utility and maintenance scripts
├── .env                    # Environment configuration (create from .env.example)
├── .env.example            # Environment variables template
├── .gitignore             # Git ignore rules
├── .dockerignore          # Docker ignore rules
├── Dockerfile             # Docker build instructions
├── docker-compose.yml     # Docker Compose configuration
├── package.json           # Root package.json (backend)
├── package-lock.json      # Dependency lock file
├── LICENSE                # MIT License
├── README.md              # Main documentation
├── install.bat            # Windows installation script
├── install.sh             # Linux/Mac installation script
├── start.bat              # Windows startup script
├── start.sh               # Linux/Mac startup script
├── clear-cache.bat        # Cache clearing utility
├── check-users.js         # User database inspection tool
└── create-test-user.js    # Test user creation script
```

## 🖥️ Backend (`/server`)

The backend is built with Node.js and Express, following a modular architecture.

### Directory Structure

```
server/
├── __tests__/             # Jest test files
│   ├── auth.test.js      # Authentication tests
│   ├── forum.test.js     # Forum functionality tests
│   └── health.test.js    # Health check tests
│
├── database/              # Database layer
│   └── init.js           # Database initialization and schema
│
├── middleware/            # Express middleware
│   ├── auth.js           # JWT authentication middleware
│   ├── validation.js     # Input validation middleware
│   └── errorHandler.js   # Global error handling
│
├── routes/                # API route handlers
│   ├── auth.js           # Authentication endpoints
│   ├── blog.js           # Blog/news endpoints
│   ├── chat.js           # Chat endpoints
│   ├── donations.js      # Donation management
│   ├── forum-actions.js  # Forum interactions (like, reply, etc.)
│   ├── forum-admin.js    # Forum administration
│   ├── forum-core.js     # Core forum functionality
│   ├── forum-moderation.js # Forum moderation tools
│   ├── health.js         # Health check endpoints
│   ├── messages.js       # Private messaging
│   ├── registration.js   # User registration
│   ├── servers.js        # Minecraft server management
│   ├── social.js         # Social features (friends, etc.)
│   └── users.js          # User profile management
│
├── services/              # Business logic layer
│   └── discord.js        # Discord bot integration
│
├── utils/                 # Utility functions
│   ├── env-validator.js  # Environment validation
│   ├── logger.js         # Winston logging configuration
│   ├── sanitizer.js      # Input sanitization
│   └── swagger.js        # Swagger/OpenAPI documentation
│
└── index.js              # Main server entry point
```

### Key Backend Files

#### `server/index.js`
Main server file that:
- Initializes Express app
- Configures middleware (CORS, Helmet, rate limiting)
- Mounts API routes
- Sets up WebSocket server
- Handles graceful shutdown
- Configures error handling

#### `server/database/init.js`
Database initialization:
- Creates SQLite database schema
- Defines all tables (users, posts, servers, etc.)
- Provides database access functions
- Handles migrations

#### `server/middleware/auth.js`
Authentication middleware:
- Verifies JWT tokens
- Extracts user information
- Handles role-based authorization
- Protects API routes

#### `server/services/discord.js`
Discord integration:
- Connects Discord bot
- Listens to channel messages
- Broadcasts to WebSocket clients
- Handles Discord webhooks

#### `server/utils/logger.js`
Logging configuration:
- Winston logger setup
- File rotation (daily logs)
- Console and file transports
- Different log levels by environment

## 🎨 Frontend (`/client`)

The frontend is built with React 18 and TypeScript, using a component-based architecture.

### Directory Structure

```
client/
├── public/                # Static assets
│   ├── index.html        # HTML template
│   └── favicon.ico       # Site favicon
│
├── src/                   # Source code
│   ├── components/       # Reusable React components
│   │   ├── Header.tsx   # Navigation header
│   │   ├── Footer.tsx   # Page footer
│   │   ├── ChatWidget.tsx # Real-time chat component
│   │   ├── ServerCard.tsx # Server display card
│   │   ├── BlogCard.tsx  # Blog post card
│   │   └── ...          # Other shared components
│   │
│   ├── pages/            # Page components
│   │   ├── Home.tsx     # Landing page
│   │   ├── Login.tsx    # Login page
│   │   ├── Register.tsx # Registration page
│   │   ├── Dashboard.tsx # User dashboard
│   │   ├── Servers.tsx  # Server list
│   │   ├── Blog.tsx     # Blog listing
│   │   ├── Forum.tsx    # Forum pages
│   │   ├── Profile.tsx  # User profile
│   │   ├── Admin/       # Admin panel pages
│   │   └── ...          # Other pages
│   │
│   ├── services/         # API integration
│   │   ├── api.ts       # Axios configuration
│   │   └── auth.ts      # Authentication service
│   │
│   ├── context/          # React Context
│   │   └── AuthContext.tsx # Authentication context
│   │
│   ├── config/           # Configuration
│   │   └── config.ts    # App configuration
│   │
│   ├── App.tsx           # Main app component
│   ├── App.css           # Global styles
│   ├── index.tsx         # Entry point
│   └── index.css         # Base styles
│
├── .env.development       # Development environment
├── .env.production        # Production environment
├── .env.local            # Local overrides
├── package.json          # Frontend dependencies
├── package-lock.json     # Dependency lock
└── tsconfig.json         # TypeScript configuration
```

### Key Frontend Files

#### `client/src/App.tsx`
Main application component:
- React Router configuration
- Route definitions
- Layout structure
- Global providers

#### `client/src/services/api.ts`
API client configuration:
- Axios instance setup
- Request/response interceptors
- Authentication header injection
- Error handling

#### `client/src/context/AuthContext.tsx`
Authentication context:
- User state management
- Login/logout functions
- Token storage
- Protected route logic

#### `client/src/components/ChatWidget.tsx`
Real-time chat component:
- WebSocket connection
- Message display
- Real-time updates
- Discord integration

## 🗄️ Database (`/data`)

SQLite database structure (auto-created on first run):

### Tables

#### `users`
User accounts and authentication:
- `id` - Primary key
- `username` - Unique username
- `email` - User email
- `password_hash` - Bcrypt hashed password
- `role` - User role (user, admin, moderator)
- `created_at` - Registration timestamp
- `last_login` - Last login timestamp
- `avatar_url` - Profile picture URL
- `bio` - User biography

#### `servers`
Minecraft server information:
- `id` - Primary key
- `name` - Server name
- `ip` - Server IP address
- `port` - Server port
- `version` - Minecraft version
- `description` - Server description
- `max_players` - Maximum player capacity
- `online_players` - Current player count
- `status` - Server status (online/offline)
- `last_updated` - Last status check

#### `blog_posts`
Blog/news articles:
- `id` - Primary key
- `title` - Post title
- `content` - Post content (markdown)
- `author_id` - Foreign key to users
- `category` - Post category
- `tags` - Post tags (JSON)
- `published` - Publication status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `views` - View count

#### `forum_categories`
Forum category organization:
- `id` - Primary key
- `name` - Category name
- `description` - Category description
- `icon` - Category icon
- `order` - Display order

#### `forum_posts`
Forum posts:
- `id` - Primary key
- `category_id` - Foreign key to categories
- `title` - Post title
- `content` - Post content
- `author_id` - Foreign key to users
- `pinned` - Pin status
- `locked` - Lock status
- `views` - View count
- `created_at` - Creation timestamp

#### `forum_replies`
Forum post replies:
- `id` - Primary key
- `post_id` - Foreign key to posts
- `author_id` - Foreign key to users
- `content` - Reply content
- `created_at` - Creation timestamp

#### `donations`
Donation tracking:
- `id` - Primary key
- `user_id` - Foreign key to users
- `amount` - Donation amount
- `status` - Payment status
- `payment_method` - Payment method
- `transaction_id` - External transaction ID
- `created_at` - Donation timestamp

#### `messages`
Private messages:
- `id` - Primary key
- `from_user_id` - Sender user ID
- `to_user_id` - Recipient user ID
- `subject` - Message subject
- `content` - Message content
- `read` - Read status
- `created_at` - Send timestamp

#### `friendships`
User friend relationships:
- `id` - Primary key
- `user_id` - User ID
- `friend_id` - Friend user ID
- `status` - Friendship status (pending/accepted)
- `created_at` - Request timestamp

## 📜 Scripts (`/scripts`)

Utility scripts for maintenance and operations:

### `scripts/backup-db.js`
Database backup utility:
- Creates timestamped backups
- Stores in `/backups` directory
- Configurable retention policy

## 🔧 Configuration Files

### `.env`
Environment configuration (not in git):
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secret-key
DISCORD_BOT_TOKEN=your-bot-token
CLIENT_URL=https://vonix.network
```

### `.env.example`
Environment template with documentation:
- All available options
- Default values
- Setup instructions

### `docker-compose.yml`
Docker orchestration:
- Service definitions
- Volume mappings
- Network configuration
- Health checks

### `Dockerfile`
Docker image build:
- Multi-stage build
- Production optimization
- Security best practices
- Non-root user

### `package.json` (Root)
Backend dependencies and scripts:
```json
{
  "scripts": {
    "dev": "concurrently server and client",
    "start": "Start production server",
    "build": "Build frontend",
    "test": "Run tests",
    "backup": "Backup database"
  }
}
```

### `client/package.json`
Frontend dependencies:
- React and React DOM
- TypeScript
- React Router
- Axios
- Testing libraries

## 🚀 Build Output

### Production Build
After running `npm run build`:
```
client/build/              # Production frontend
├── static/
│   ├── css/              # Minified CSS
│   ├── js/               # Minified JS bundles
│   └── media/            # Optimized assets
├── index.html            # Optimized HTML
└── asset-manifest.json   # Asset mapping
```

## 📊 Runtime Directories

### `data/`
Created on first run:
- `vonix.db` - Main SQLite database
- `vonix.db-shm` - Shared memory file
- `vonix.db-wal` - Write-ahead log

### `logs/`
Application logs:
- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only
- Rotates daily
- Retention: 14 days

### `backups/`
Database backups:
- `vonix-backup-YYYY-MM-DD-HHmmss.db`
- Created manually via `npm run backup`
- Not automatically deleted

## 🔒 Security Considerations

### File Permissions
- `.env` should be readable only by application user
- `data/` directory needs write permissions
- `logs/` directory needs write permissions
- Public files served from `client/build/` only

### Excluded from Git
(See `.gitignore`):
- `.env` - Contains secrets
- `node_modules/` - Dependencies
- `data/` - Database files
- `logs/` - Log files
- `backups/` - Database backups
- `client/build/` - Build artifacts

## 📈 Scalability Notes

### Current Architecture
- **Single server** - All services on one machine
- **SQLite** - File-based database
- **In-memory** - WebSocket connections and cache

### Future Considerations
For scaling beyond single server:
1. **Database**: Migrate to PostgreSQL or MySQL
2. **Cache**: Add Redis for distributed caching
3. **WebSocket**: Use Redis pub/sub for multi-instance
4. **Storage**: Move to cloud storage (S3, etc.)
5. **Load Balancer**: Add Nginx or HAProxy
6. **Sessions**: Use Redis session store

## 🧪 Testing Structure

```
server/__tests__/
├── auth.test.js          # Authentication tests
├── forum.test.js         # Forum functionality tests
├── health.test.js        # Health check tests
└── ...                   # Additional test files
```

Test coverage target: 80%

## 📝 Documentation Files

- **README.md** - Main project documentation
- **PROJECT_STRUCTURE.md** - This file
- **API_DOCUMENTATION.md** - API reference
- **CONTRIBUTING.md** - Contribution guidelines
- **SECURITY.md** - Security policies
- **DEPLOYMENT.md** - Deployment guide
- **CODE_OF_CONDUCT.md** - Community guidelines
- **LICENSE** - MIT License

## 🔄 Development Workflow

1. **Local Development**: `npm run dev`
2. **Run Tests**: `npm test`
3. **Build Frontend**: `npm run build`
4. **Start Production**: `npm start`

## 🐳 Docker Structure

```
Docker Container:
/app/
├── node_modules/         # Backend dependencies
├── server/               # Backend code
├── client/build/         # Built frontend
├── data/                 # Persistent volume
├── logs/                 # Persistent volume
└── backups/              # Persistent volume
```

Volumes are mapped to host for persistence.

## 📦 Dependencies Overview

### Backend Core
- **express** - Web framework
- **better-sqlite3** - SQLite database
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **discord.js** - Discord integration
- **ws** - WebSocket server

### Backend Security
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation
- **dompurify** - XSS sanitization

### Backend Utilities
- **winston** - Logging
- **morgan** - HTTP logging
- **dotenv** - Environment variables
- **axios** - HTTP client
- **node-cache** - In-memory caching

### Frontend Core
- **react** - UI library
- **react-router-dom** - Routing
- **axios** - HTTP client
- **typescript** - Type safety

---

**Note**: This structure is designed for a single-server deployment. For enterprise-scale deployments, consider microservices architecture and containerized orchestration (Kubernetes).
