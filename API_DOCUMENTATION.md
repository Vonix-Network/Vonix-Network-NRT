# API Documentation

Complete REST API reference for Vonix Network Community Platform.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.vonix.network/api`

## Interactive Documentation

Interactive Swagger/OpenAPI documentation available at:
- **Development**: http://localhost:5000/api-docs
- **Production**: https://api.vonix.network/api-docs

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow

1. Register or login to receive JWT token
2. Include token in subsequent requests
3. Token expires after 24 hours (configurable)
4. Refresh token before expiration

## Rate Limits

API endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 20 requests | 15 minutes |
| General API | 1000 requests | 5 minutes |
| Authenticated | 2000 requests | 5 minutes |
| Post Creation | 15 requests | 15 minutes |
| Comments | 20 requests | 5 minutes |
| Friend Requests | 25 requests | 1 hour |

Rate limit headers are included in responses:
- `RateLimit-Limit` - Total requests allowed
- `RateLimit-Remaining` - Remaining requests
- `RateLimit-Reset` - Time until limit resets

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

# API Endpoints

## Authentication

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "username": "string (3-30 chars, alphanumeric)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)"
}
```

**Response**: `201 Created`
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errors**:
- `400` - Validation error or user exists
- `500` - Server error

---

### Login

Authenticate and receive JWT token.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response**: `200 OK`
```json
{
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "last_login": "2025-01-15T10:30:00.000Z"
  }
}
```

**Errors**:
- `400` - Missing credentials
- `401` - Invalid credentials
- `500` - Server error

---

### Get Current User

Get authenticated user information.

**Endpoint**: `GET /api/auth/me`

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "avatar_url": "https://...",
  "bio": "User biography",
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

**Errors**:
- `401` - Not authenticated
- `500` - Server error

---

## Servers

### List Servers

Get all Minecraft servers.

**Endpoint**: `GET /api/servers`

**Query Parameters**:
- `status` (optional) - Filter by status: `online`, `offline`, `all` (default: `all`)

**Response**: `200 OK`
```json
{
  "servers": [
    {
      "id": 1,
      "name": "Survival Server",
      "ip": "play.vonix.network",
      "port": 25565,
      "version": "1.20.4",
      "description": "Pure vanilla survival experience",
      "max_players": 100,
      "online_players": 45,
      "status": "online",
      "motd": "Welcome to Vonix Network!",
      "last_updated": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### Get Server Details

Get detailed information about a specific server.

**Endpoint**: `GET /api/servers/:id`

**Response**: `200 OK`
```json
{
  "id": 1,
  "name": "Survival Server",
  "ip": "play.vonix.network",
  "port": 25565,
  "version": "1.20.4",
  "description": "Pure vanilla survival experience",
  "max_players": 100,
  "online_players": 45,
  "status": "online",
  "motd": "Welcome to Vonix Network!",
  "players": ["Player1", "Player2"],
  "uptime": "5 days 3 hours",
  "last_updated": "2025-01-15T10:30:00.000Z"
}
```

**Errors**:
- `404` - Server not found

---

### Get Server Status

Real-time server status check.

**Endpoint**: `GET /api/servers/:id/status`

**Response**: `200 OK`
```json
{
  "online": true,
  "players": {
    "online": 45,
    "max": 100
  },
  "version": "1.20.4",
  "motd": "Welcome to Vonix Network!",
  "latency": 45
}
```

---

### Create Server (Admin)

Add a new server.

**Endpoint**: `POST /api/servers`

**Headers**: `Authorization: Bearer <admin-token>`

**Request Body**:
```json
{
  "name": "string",
  "ip": "string",
  "port": 25565,
  "version": "string",
  "description": "string",
  "max_players": 100
}
```

**Response**: `201 Created`

**Errors**:
- `401` - Not authenticated
- `403` - Not admin
- `400` - Validation error

---

### Update Server (Admin)

Update server information.

**Endpoint**: `PUT /api/servers/:id`

**Headers**: `Authorization: Bearer <admin-token>`

**Request Body**: Same as Create Server

**Response**: `200 OK`

---

### Delete Server (Admin)

Remove a server.

**Endpoint**: `DELETE /api/servers/:id`

**Headers**: `Authorization: Bearer <admin-token>`

**Response**: `204 No Content`

---

## Chat

### Get Chat History

Retrieve recent chat messages.

**Endpoint**: `GET /api/chat/messages`

**Query Parameters**:
- `limit` (optional) - Number of messages (default: 50, max: 100)
- `before` (optional) - Get messages before timestamp

**Response**: `200 OK`
```json
{
  "messages": [
    {
      "id": 1,
      "author_name": "JohnDoe",
      "author_avatar": "https://...",
      "content": "Hello everyone!",
      "timestamp": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### WebSocket Chat

Real-time chat via WebSocket.

**Endpoint**: `ws://localhost:5000/ws/chat`

**Connection**:
```javascript
const ws = new WebSocket('ws://localhost:5000/ws/chat');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

**Message Format**:
```json
{
  "id": 1,
  "author_name": "JohnDoe",
  "author_avatar": "https://...",
  "content": "Message content",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Blog

### List Blog Posts

Get all blog posts.

**Endpoint**: `GET /api/blog/posts`

**Query Parameters**:
- `category` (optional) - Filter by category
- `limit` (optional) - Posts per page (default: 10)
- `offset` (optional) - Pagination offset
- `published` (optional) - Filter by published status (default: true)

**Response**: `200 OK`
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Server Update v2.0",
      "slug": "server-update-v2-0",
      "excerpt": "Major server improvements...",
      "content": "Full content...",
      "author": {
        "id": 1,
        "username": "admin",
        "avatar_url": "https://..."
      },
      "category": "news",
      "tags": ["update", "features"],
      "published": true,
      "views": 150,
      "created_at": "2025-01-15T10:30:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pages": 3
}
```

---

### Get Blog Post

Get single blog post by ID or slug.

**Endpoint**: `GET /api/blog/posts/:id`

**Response**: `200 OK` (same structure as list item)

**Errors**:
- `404` - Post not found

---

### Create Blog Post (Admin)

Create new blog post.

**Endpoint**: `POST /api/blog/posts`

**Headers**: `Authorization: Bearer <admin-token>`

**Request Body**:
```json
{
  "title": "string",
  "content": "string (markdown supported)",
  "category": "string",
  "tags": ["tag1", "tag2"],
  "published": true
}
```

**Response**: `201 Created`

---

### Update Blog Post (Admin)

Update existing post.

**Endpoint**: `PUT /api/blog/posts/:id`

**Headers**: `Authorization: Bearer <admin-token>`

**Request Body**: Same as Create

**Response**: `200 OK`

---

### Delete Blog Post (Admin)

Delete a blog post.

**Endpoint**: `DELETE /api/blog/posts/:id`

**Headers**: `Authorization: Bearer <admin-token>`

**Response**: `204 No Content`

---

## Forum

### List Categories

Get all forum categories.

**Endpoint**: `GET /api/forum/categories`

**Response**: `200 OK`
```json
{
  "categories": [
    {
      "id": 1,
      "name": "General Discussion",
      "description": "Talk about anything",
      "icon": "💬",
      "order": 1,
      "post_count": 150,
      "reply_count": 892
    }
  ]
}
```

---

### List Posts

Get forum posts.

**Endpoint**: `GET /api/forum/posts`

**Query Parameters**:
- `category_id` (optional) - Filter by category
- `limit` (optional) - Posts per page (default: 20)
- `offset` (optional) - Pagination offset
- `pinned` (optional) - Filter pinned posts

**Response**: `200 OK`
```json
{
  "posts": [
    {
      "id": 1,
      "category_id": 1,
      "title": "Welcome to the Forum",
      "content": "Post content...",
      "author": {
        "id": 1,
        "username": "admin",
        "avatar_url": "https://..."
      },
      "pinned": true,
      "locked": false,
      "views": 1250,
      "reply_count": 45,
      "last_reply_at": "2025-01-15T10:30:00.000Z",
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "total": 150
}
```

---

### Get Post Details

Get single post with replies.

**Endpoint**: `GET /api/forum/posts/:id`

**Response**: `200 OK`
```json
{
  "id": 1,
  "category_id": 1,
  "title": "Welcome to the Forum",
  "content": "Post content...",
  "author": {
    "id": 1,
    "username": "admin",
    "avatar_url": "https://..."
  },
  "pinned": true,
  "locked": false,
  "views": 1250,
  "created_at": "2025-01-15T10:30:00.000Z",
  "replies": [
    {
      "id": 1,
      "content": "Reply content...",
      "author": {
        "id": 2,
        "username": "user123",
        "avatar_url": "https://..."
      },
      "created_at": "2025-01-15T11:00:00.000Z"
    }
  ]
}
```

---

### Create Post

Create new forum post.

**Endpoint**: `POST /api/forum/posts`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "category_id": 1,
  "title": "string (min 5 chars)",
  "content": "string (min 20 chars)"
}
```

**Response**: `201 Created`

---

### Reply to Post

Add reply to forum post.

**Endpoint**: `POST /api/forum/posts/:id/replies`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "content": "string (min 10 chars)"
}
```

**Response**: `201 Created`

---

### Edit Post

Edit your own post.

**Endpoint**: `PUT /api/forum/posts/:id`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "title": "string",
  "content": "string"
}
```

**Response**: `200 OK`

**Errors**:
- `403` - Not post owner or post locked

---

### Delete Post

Delete your own post.

**Endpoint**: `DELETE /api/forum/posts/:id`

**Headers**: `Authorization: Bearer <token>`

**Response**: `204 No Content`

---

### Like Post

Like/unlike a post.

**Endpoint**: `POST /api/forum-actions/posts/:id/like`

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "liked": true,
  "like_count": 15
}
```

---

### Moderate Post (Moderator)

Pin, lock, or delete posts.

**Endpoint**: `POST /api/forum-mod/posts/:id/moderate`

**Headers**: `Authorization: Bearer <moderator-token>`

**Request Body**:
```json
{
  "action": "pin|unpin|lock|unlock|delete",
  "reason": "string (optional)"
}
```

**Response**: `200 OK`

---

## Users

### Get User Profile

Get public user profile.

**Endpoint**: `GET /api/users/:id`

**Response**: `200 OK`
```json
{
  "id": 1,
  "username": "johndoe",
  "avatar_url": "https://...",
  "bio": "User biography",
  "role": "user",
  "created_at": "2025-01-15T10:30:00.000Z",
  "stats": {
    "post_count": 45,
    "reply_count": 120,
    "likes_received": 89
  }
}
```

---

### Update Profile

Update your own profile.

**Endpoint**: `PUT /api/users/profile`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "bio": "string (max 500 chars)",
  "avatar_url": "string (valid URL)"
}
```

**Response**: `200 OK`

---

### Change Password

Change user password.

**Endpoint**: `PUT /api/users/password`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "current_password": "string",
  "new_password": "string (min 8 chars)"
}
```

**Response**: `200 OK`

**Errors**:
- `400` - Invalid current password

---

## Donations

### Get Donation Info

Get donation packages and goals.

**Endpoint**: `GET /api/donations/info`

**Response**: `200 OK`
```json
{
  "packages": [
    {
      "id": 1,
      "name": "VIP",
      "price": 9.99,
      "benefits": ["Feature 1", "Feature 2"]
    }
  ],
  "goal": {
    "target": 1000,
    "current": 450,
    "percentage": 45
  }
}
```

---

### Create Donation (Admin)

Record a donation.

**Endpoint**: `POST /api/donations`

**Headers**: `Authorization: Bearer <admin-token>`

**Request Body**:
```json
{
  "user_id": 1,
  "amount": 9.99,
  "payment_method": "paypal",
  "transaction_id": "TXN123456"
}
```

**Response**: `201 Created`

---

## Messages

### Get Inbox

Get received messages.

**Endpoint**: `GET /api/messages/inbox`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `unread` (optional) - Filter unread (true/false)
- `limit` (optional) - Messages per page

**Response**: `200 OK`
```json
{
  "messages": [
    {
      "id": 1,
      "from_user": {
        "id": 2,
        "username": "sender",
        "avatar_url": "https://..."
      },
      "subject": "Hello!",
      "content": "Message content...",
      "read": false,
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  ],
  "unread_count": 3
}
```

---

### Send Message

Send private message.

**Endpoint**: `POST /api/messages`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "to_user_id": 2,
  "subject": "string",
  "content": "string"
}
```

**Response**: `201 Created`

---

### Mark as Read

Mark message as read.

**Endpoint**: `PUT /api/messages/:id/read`

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`

---

## Social

### Get Friends

Get user's friends list.

**Endpoint**: `GET /api/social/friends`

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`
```json
{
  "friends": [
    {
      "id": 2,
      "username": "friend123",
      "avatar_url": "https://...",
      "status": "online",
      "since": "2025-01-10T10:30:00.000Z"
    }
  ]
}
```

---

### Send Friend Request

Send friend request to user.

**Endpoint**: `POST /api/social/friends/request`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "user_id": 2
}
```

**Response**: `201 Created`

---

### Accept Friend Request

Accept pending friend request.

**Endpoint**: `POST /api/social/friends/accept/:id`

**Headers**: `Authorization: Bearer <token>`

**Response**: `200 OK`

---

### Remove Friend

Remove friend or decline request.

**Endpoint**: `DELETE /api/social/friends/:id`

**Headers**: `Authorization: Bearer <token>`

**Response**: `204 No Content`

---

## Health & Monitoring

### Health Check

Check API health status.

**Endpoint**: `GET /api/health`

**Response**: `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 86400,
  "checks": {
    "database": "healthy",
    "discord": "healthy",
    "websocket": "healthy"
  },
  "version": "1.0.0"
}
```

---

### Simple Status

Quick status check.

**Endpoint**: `GET /api/status`

**Response**: `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## Error Handling

### Common Errors

#### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "username",
      "message": "Username must be 3-30 characters"
    }
  ]
}
```

#### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

#### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

#### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

#### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "error": "An error occurred"
}
```

---

## Pagination

List endpoints support pagination:

**Query Parameters**:
- `limit` - Items per page (default varies by endpoint)
- `offset` - Number of items to skip

**Response includes**:
```json
{
  "data": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

---

## Filtering & Sorting

Some endpoints support filtering and sorting:

**Query Parameters**:
- `sort` - Field to sort by
- `order` - Sort order: `asc` or `desc`
- Various filters specific to endpoint

Example:
```
GET /api/forum/posts?category_id=1&sort=created_at&order=desc&limit=10
```

---

## CORS

CORS is configured to allow requests from:
- Configured `CLIENT_URL`
- localhost:3000 (development)

Credentials (cookies, auth headers) are supported.

---

## Content Types

All requests and responses use `application/json` unless otherwise specified.

Request:
```
Content-Type: application/json
```

Response:
```
Content-Type: application/json
```

---

## Webhooks

### Discord Webhook

Webhooks can be configured for various events (admin only).

Events:
- New user registration
- New forum post
- Server status changes
- Donation received

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Login
const login = async (username: string, password: string) => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
};

// Get servers
const getServers = async () => {
  const { data } = await api.get('/servers');
  return data.servers;
};

// Create forum post
const createPost = async (categoryId: number, title: string, content: string) => {
  const { data } = await api.post('/forum/posts', {
    category_id: categoryId,
    title,
    content
  });
  return data;
};
```

---

## Versioning

Current API version: **v1**

Future versions will be accessed via:
```
/api/v2/...
```

Current endpoints are implicitly v1 and will remain stable.

---

## Support

- **Interactive Docs**: http://localhost:5000/api-docs
- **Issues**: GitHub Issues
- **Discord**: Community server
- **Email**: support@vonix.network

---

**Last Updated**: 2025-01-15
**API Version**: 1.0.0
