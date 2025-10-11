# Minecraft Mod Login Integration - Implementation Summary

## Overview
This update adds a new `/login <password>` command endpoint for Minecraft mods to authenticate users after they've registered on the website using the existing code-based registration system.

## What Was Changed

### 1. New Login Endpoint
**File**: `server/routes/registration.js`

Added `POST /api/registration/login` endpoint that:
- Accepts `minecraft_uuid` and `password` in the request body
- Validates the Minecraft UUID format
- Finds the user by their Minecraft UUID
- Verifies the password using bcrypt
- Returns a JWT token valid for 7 days
- Protected by the same `X-API-Key` middleware as the registration endpoint
- Returns user details including donation rank information

**Request Format**:
```json
{
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "password": "PlainTextPassword123"
}
```

**Response Format**:
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "PlayerName",
    "minecraft_username": "PlayerName",
    "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user",
    "donation_rank_id": "patron"
  }
}
```

### 2. CORS Configuration Update
**File**: `server/index.js`

Updated CORS configuration to allow the following headers:
- `X-API-Key` - The registration API key
- `X-Registration-Key` - Alternative header name support

This ensures Minecraft mods can send the authentication headers without CORS issues.

### 3. API Documentation Update
**File**: `API_DOCUMENTATION.md`

Added a new "Minecraft Registration" section with detailed documentation for:
- Generate Registration Code (`POST /api/registration/generate-code`)
- Register with Code (`POST /api/registration/register`)
- **Minecraft Mod Login** (`POST /api/registration/login`) ← New endpoint
- Check Registration Code (`GET /api/registration/check-code/:code`)
- Registration Statistics (`GET /api/registration/stats`)

### 4. Comprehensive Integration Guide
**File**: `MINECRAFT_MOD_INTEGRATION.md` (New)

Created a complete guide for Minecraft mod developers including:
- Detailed endpoint documentation
- Security best practices
- Complete Java implementation examples
- Testing instructions using cURL and Postman
- Troubleshooting guide
- Error handling examples

## Security Features

1. **API Key Protection**: All mod endpoints require `X-API-Key` header
2. **Password Validation**: Server-side bcrypt comparison
3. **UUID Validation**: Strict format checking for Minecraft UUIDs
4. **Rate Limiting**: Login endpoint limited to 20 requests per 15 minutes
5. **HTTPS Required**: Production environment requires secure connections
6. **Token Expiration**: JWT tokens expire after 7 days
7. **Error Messages**: Generic error messages to prevent information leakage

## How It Works

### Registration Flow (Existing)
1. Player types `/vonixregister` in Minecraft
2. Mod calls `POST /api/registration/generate-code` with UUID and username
3. Server returns a 6-character code valid for 10 minutes
4. Player goes to website and registers with code + password
5. Website calls `POST /api/registration/register`
6. Server creates user account and returns JWT token

### Login Flow (New)
1. Player types `/login <password>` in Minecraft
2. Mod calls `POST /api/registration/login` with UUID and password
3. Server validates password against stored bcrypt hash
4. Server returns JWT token and user details
5. Mod stores token for authenticated API calls
6. Mod applies ranks/perks based on user data

## Files Modified

1. ✅ `server/routes/registration.js` - Added login endpoint
2. ✅ `server/index.js` - Updated CORS headers
3. ✅ `API_DOCUMENTATION.md` - Added endpoint documentation
4. ✅ `MINECRAFT_MOD_INTEGRATION.md` - New comprehensive guide

## Testing

The endpoint has been validated for:
- ✅ Syntax correctness (Node.js parse check)
- ✅ Proper error handling
- ✅ Security middleware integration
- ✅ Response format consistency

## Usage Instructions for Mod Developers

See `MINECRAFT_MOD_INTEGRATION.md` for complete implementation guide.

### Quick Example (Java):
```java
JSONObject body = new JSONObject();
body.put("minecraft_uuid", player.getUniqueId().toString());
body.put("password", password);

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.vonix.network/api/registration/login"))
    .header("Content-Type", "application/json")
    .header("X-API-Key", API_KEY)
    .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
    .build();

HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

if (response.statusCode() == 200) {
    JSONObject data = new JSONObject(response.body());
    String token = data.getString("token");
    // Store token and apply perks
}
```

## Configuration Required

### Server Setup
1. Set `REGISTRATION_API_KEY` in the settings database:
   ```sql
   INSERT INTO settings (key, value) VALUES ('REGISTRATION_API_KEY', 'your-secure-random-key');
   ```

2. Or configure via admin panel (if available)

### Mod Configuration
1. Set environment variable or config file with API key
2. Configure API base URL (production vs development)
3. Implement token storage mechanism
4. Add error handling and user feedback

## API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/registration/generate-code` | Generate registration code | X-API-Key |
| POST | `/api/registration/register` | Complete registration on website | None |
| POST | `/api/registration/login` | Login from Minecraft mod | X-API-Key |
| GET | `/api/registration/check-code/:code` | Validate code | None |
| GET | `/api/registration/stats` | Get statistics | None |

## Error Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid UUID format, missing parameters |
| 401 | Unauthorized | Invalid/missing API key, wrong password |
| 404 | Not Found | No account found for UUID |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Database or server issues |

## Next Steps for Deployment

1. **Generate API Key**: 
   - Create a strong random API key (32+ characters)
   - Store securely in settings database
   
2. **Update Mod**:
   - Implement login command
   - Add API key to mod configuration
   - Test in development environment
   
3. **Documentation**:
   - Share `MINECRAFT_MOD_INTEGRATION.md` with mod developers
   - Update player-facing documentation
   
4. **Testing**:
   - Test full registration flow
   - Test login with various scenarios
   - Verify rate limiting works
   - Check error handling
   
5. **Monitoring**:
   - Monitor login endpoint usage
   - Track failed login attempts
   - Set up alerts for suspicious activity

## Compatibility

- **Node.js**: Requires Node.js 14+ (bcryptjs, jsonwebtoken)
- **Database**: SQLite3 via better-sqlite3
- **Minecraft**: Works with any mod/plugin that can make HTTP requests
- **Security**: Requires HTTPS in production

## Future Enhancements (Optional)

1. **Token Refresh**: Add endpoint to refresh expired tokens
2. **2FA Support**: Add two-factor authentication option
3. **Session Management**: Track active sessions per player
4. **Login History**: Log login attempts and locations
5. **Password Reset**: Add in-game password reset flow
6. **Multiple Devices**: Support multiple concurrent logins
7. **Auto-Logout**: Implement automatic logout on disconnect

## Support

For questions or issues:
- Check `MINECRAFT_MOD_INTEGRATION.md` for detailed guide
- Review `API_DOCUMENTATION.md` for API reference
- Check server logs for error details
- Contact Vonix Network support

---

**Implementation Date**: 2025-10-11  
**API Version**: 1.0.0  
**Status**: ✅ Complete and Ready for Testing
