# Minecraft Login API Integration

This document describes the new Minecraft login endpoint that integrates with the existing registration system to allow users to log in directly from the Minecraft mod using their website account credentials.

## Overview

The integration allows Minecraft players to:
1. Register on the website using `/vonixregister` command (existing)
2. Login directly in-game using `/login <password>` command (new)

## API Endpoints

### POST `/api/registration/login`

Authenticates a Minecraft user using their pre-encrypted password and returns a JWT token for website access.

#### Headers
- `X-API-Key`: Registration API key (required)
- `Content-Type`: `application/json`

#### Request Body
```json
{
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "12345678-1234-1234-1234-123456789012",
  "encrypted_password": "hashed_password_here"
}
```

#### Response (Success - 200)
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "PlayerName",
    "role": "user",
    "mustChangePassword": false,
    "minecraft_username": "PlayerName",
    "minecraft_uuid": "12345678-1234-1234-1234-123456789012",
    "total_donated": 0,
    "donation_rank_id": null,
    "donation_rank_expires_at": null,
    "donation_rank": null
  }
}
```

#### Response (Error - 400)
```json
{
  "error": "Minecraft username, UUID, and encrypted password required"
}
```

#### Response (Error - 401)
```json
{
  "error": "Invalid Minecraft credentials"
}
```

#### Response (Error - 401)
```json
{
  "error": "API key required",
  "message": "Please provide X-API-Key header"
}
```

#### Response (Error - 403)
```json
{
  "error": "Invalid API key",
  "message": "The provided API key is incorrect"
}
```

## Security Features

### API Key Protection
- All requests must include a valid `X-API-Key` header
- API key is stored in the database settings table
- Invalid or missing API keys are rejected with appropriate error messages

### Input Validation
- Minecraft username: 3-16 characters, alphanumeric and underscores only
- Minecraft UUID: Valid UUID format required
- Password: Must be pre-encrypted using bcrypt

### Password Security
- Passwords are hashed using bcrypt with 10 rounds
- The endpoint expects pre-encrypted passwords from the Minecraft mod
- Password verification uses `bcrypt.compareSync()` for secure comparison

## Integration Flow

### 1. User Registration (Existing)
```
Minecraft: /vonixregister
↓
Mod calls: POST /api/registration/generate-code
↓
User visits website with code
↓
User registers: POST /api/registration/register
↓
Account created with encrypted password
```

### 2. User Login (New)
```
Minecraft: /login <password>
↓
Mod encrypts password using bcrypt
↓
Mod calls: POST /api/registration/login
↓
Server validates credentials
↓
Returns JWT token for website access
```

## Minecraft Mod Implementation

### Password Encryption
The Minecraft mod should encrypt passwords using bcrypt before sending them to the API:

```java
// Example Java implementation
import org.mindrot.jbcrypt.BCrypt;

String password = "user_input_password";
String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt(10));
```

### API Request Example
```java
// Example HTTP request from mod
HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.vonix.network/api/registration/login"))
    .header("X-API-Key", "your-registration-api-key-here")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\"minecraft_username\":\"" + playerName + "\"," +
        "\"minecraft_uuid\":\"" + playerUUID + "\"," +
        "\"encrypted_password\":\"" + hashedPassword + "\"}"
    ))
    .build();
```

## Configuration

### Environment Variables
- `REGISTRATION_API_KEY`: The API key for Minecraft mod authentication
- `JWT_SECRET`: Secret key for JWT token generation
- `DATABASE_PATH`: Path to the SQLite database

### Database Setup
The API key must be set in the database settings table:
```sql
INSERT INTO settings (key, value) VALUES ('REGISTRATION_API_KEY', 'your-secure-api-key-here');
```

## Error Handling

### Common Error Scenarios
1. **Invalid API Key**: Check that the `X-API-Key` header matches the configured value
2. **User Not Found**: Ensure the user has registered on the website first
3. **Invalid Password**: Verify password encryption is using the same bcrypt settings
4. **Invalid UUID Format**: Ensure UUID is in proper format (8-4-4-4-12)

### Logging
All login attempts are logged with:
- Success/failure status
- Minecraft username and UUID
- IP address
- Timestamp

## Testing

A test script is provided at `/workspace/test-minecraft-login.js` that demonstrates:
- Registration code generation
- User registration
- Successful login
- Invalid credential handling
- API key validation

Run the test with:
```bash
node test-minecraft-login.js
```

## Security Considerations

1. **API Key Management**: Store the API key securely and rotate it regularly
2. **Rate Limiting**: The endpoint is protected by rate limiting (20 requests per 15 minutes)
3. **Password Security**: Never log or store plain text passwords
4. **Network Security**: Use HTTPS in production
5. **Input Validation**: All inputs are validated before processing

## Migration Notes

This integration is backward compatible with the existing registration system. Users who registered before this update can still log in using the new endpoint without any changes to their accounts.