# Minecraft Integration Guide

This guide explains how to integrate the Vonix Network website with Minecraft mods/plugins using the registration and login API endpoints.

## Overview

The integration allows Minecraft players to:
1. Register for website accounts directly from in-game using `/vonixregister`
2. Login to their accounts from in-game using `/login <password>`
3. Access website features and data through authenticated API calls

## Prerequisites

- Vonix Network website running with API endpoints
- Registration API key configured (generated during setup)
- Minecraft mod/plugin with HTTP client capabilities

## API Endpoints

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.vonix.network/api`

### Authentication
All registration/login endpoints require the `X-API-Key` header with your registration API key.

## Registration Flow

### 1. Generate Registration Code

**Command**: `/vonixregister`

**API Call**: `POST /api/registration/generate-code`

```json
{
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Headers**:
```
X-API-Key: your-registration-api-key
Content-Type: application/json
```

**Response**:
```json
{
  "code": "A1B2C3",
  "expires_in": 600,
  "minecraft_username": "PlayerName"
}
```

### 2. Player Completes Registration on Website

The player visits the website and enters:
- The 6-character code
- Their desired password

This creates their account and links it to their Minecraft UUID.

## Login Flow

### Minecraft Login Command

**Command**: `/login <password>`

**API Call**: `POST /api/registration/minecraft-login`

```json
{
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000", 
  "password": "user_password"
}
```

**Headers**:
```
X-API-Key: your-registration-api-key
Content-Type: application/json
```

**Success Response**:
```json
{
  "success": true,
  "message": "Welcome back, PlayerName!",
  "token": "jwt-token-here",
  "user": {
    "id": 1,
    "username": "PlayerName",
    "minecraft_username": "PlayerName",
    "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user",
    "total_donated": 0,
    "donation_rank_id": null,
    "donation_rank_expires_at": null
  }
}
```

**Error Responses**:
```json
// Account not found
{
  "error": "Account not found. Please register first using /vonixregister"
}

// Invalid password
{
  "error": "Invalid password"
}

// Invalid API key
{
  "error": "Invalid API key"
}
```

## Implementation Examples

### Java (Minecraft Mod/Plugin)

```java
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.URI;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

public class VonixNetworkAPI {
    private static final String API_BASE = "https://api.vonix.network/api";
    private static final String API_KEY = "your-registration-api-key";
    private static final HttpClient client = HttpClient.newHttpClient();
    private static final Gson gson = new Gson();

    public static class LoginResponse {
        public boolean success;
        public String message;
        public String token;
        public User user;
        
        public static class User {
            public int id;
            public String username;
            public String minecraft_username;
            public String minecraft_uuid;
            public String role;
            public double total_donated;
            public String donation_rank_id;
        }
    }

    public static LoginResponse loginPlayer(String username, String uuid, String password) {
        try {
            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("minecraft_username", username);
            requestBody.addProperty("minecraft_uuid", uuid);
            requestBody.addProperty("password", password);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + "/registration/minecraft-login"))
                .header("Content-Type", "application/json")
                .header("X-API-Key", API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

            HttpResponse<String> response = client.send(request, 
                HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return gson.fromJson(response.body(), LoginResponse.class);
            } else {
                JsonObject error = gson.fromJson(response.body(), JsonObject.class);
                throw new RuntimeException("Login failed: " + error.get("error").getAsString());
            }
        } catch (Exception e) {
            throw new RuntimeException("API call failed", e);
        }
    }

    public static String generateRegistrationCode(String username, String uuid) {
        try {
            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("minecraft_username", username);
            requestBody.addProperty("minecraft_uuid", uuid);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE + "/registration/generate-code"))
                .header("Content-Type", "application/json")
                .header("X-API-Key", API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

            HttpResponse<String> response = client.send(request,
                HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonObject result = gson.fromJson(response.body(), JsonObject.class);
                return result.get("code").getAsString();
            } else {
                JsonObject error = gson.fromJson(response.body(), JsonObject.class);
                throw new RuntimeException("Code generation failed: " + error.get("error").getAsString());
            }
        } catch (Exception e) {
            throw new RuntimeException("API call failed", e);
        }
    }
}
```

### Usage in Minecraft Command Handler

```java
// Registration command
@Command("vonixregister")
public void onRegisterCommand(Player player) {
    try {
        String code = VonixNetworkAPI.generateRegistrationCode(
            player.getName(), 
            player.getUniqueId().toString()
        );
        
        player.sendMessage("§a[Vonix] Registration code: §f" + code);
        player.sendMessage("§a[Vonix] Visit §fhttps://vonix.network/register §ato complete registration");
        player.sendMessage("§a[Vonix] Code expires in 10 minutes");
        
    } catch (Exception e) {
        if (e.getMessage().contains("already registered")) {
            player.sendMessage("§c[Vonix] You are already registered! Use /login <password>");
        } else {
            player.sendMessage("§c[Vonix] Registration failed: " + e.getMessage());
        }
    }
}

// Login command  
@Command("login")
public void onLoginCommand(Player player, String password) {
    try {
        VonixNetworkAPI.LoginResponse response = VonixNetworkAPI.loginPlayer(
            player.getName(),
            player.getUniqueId().toString(), 
            password
        );
        
        if (response.success) {
            player.sendMessage("§a[Vonix] " + response.message);
            player.sendMessage("§a[Vonix] Welcome back, " + response.user.minecraft_username + "!");
            
            // Store token for future API calls
            storePlayerToken(player.getUniqueId(), response.token);
            
            // Apply any rank benefits
            if (response.user.donation_rank_id != null) {
                applyDonationRank(player, response.user.donation_rank_id);
            }
        }
        
    } catch (Exception e) {
        player.sendMessage("§c[Vonix] Login failed: " + e.getMessage());
    }
}
```

## Security Considerations

1. **API Key Protection**: Store the registration API key securely and never expose it to clients
2. **Password Handling**: Never log or store passwords in plaintext
3. **Token Storage**: Store JWT tokens securely and implement proper expiration handling
4. **Rate Limiting**: Implement client-side rate limiting to prevent API abuse
5. **Input Validation**: Always validate user inputs before sending to API

## Error Handling

### Common Error Codes

| Code | Description | Action |
|------|-------------|---------|
| 400 | Bad Request | Check input format and validation |
| 401 | Unauthorized | User not found or invalid password |
| 403 | Forbidden | Invalid API key |
| 429 | Too Many Requests | Implement rate limiting |
| 500 | Server Error | Retry with exponential backoff |

### Example Error Handler

```java
public void handleAPIError(int statusCode, String errorMessage, Player player) {
    switch (statusCode) {
        case 401:
            if (errorMessage.contains("Account not found")) {
                player.sendMessage("§c[Vonix] No account found. Use /vonixregister first!");
            } else {
                player.sendMessage("§c[Vonix] Invalid password. Try again.");
            }
            break;
        case 403:
            player.sendMessage("§c[Vonix] Service temporarily unavailable.");
            // Log API key issue for admin
            break;
        case 429:
            player.sendMessage("§c[Vonix] Too many requests. Please wait a moment.");
            break;
        default:
            player.sendMessage("§c[Vonix] An error occurred. Please try again later.");
    }
}
```

## Testing

Use the provided test script to verify your integration:

```bash
# Set environment variables
export API_URL="http://localhost:5000/api"
export REGISTRATION_API_KEY="your-api-key"

# Run tests
node test-minecraft-integration.js
```

## Configuration

### Environment Variables

- `REGISTRATION_API_KEY`: Your registration API key (required)
- `API_URL`: Base URL for the API (default: http://localhost:5000/api)

### Minecraft Mod Configuration

```yaml
vonix:
  api:
    base_url: "https://api.vonix.network/api"
    api_key: "your-registration-api-key"
    timeout: 30000
  messages:
    registration_success: "§a[Vonix] Registration code: §f{code}"
    login_success: "§a[Vonix] Welcome back, {username}!"
    login_failed: "§c[Vonix] Login failed: {error}"
```

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check that your API key is correct and properly configured
2. **"Account not found"**: User needs to register first using `/vonixregister`
3. **Connection timeout**: Check network connectivity and API server status
4. **Invalid UUID format**: Ensure UUID is properly formatted with hyphens

### Debug Mode

Enable debug logging to see full API requests and responses:

```java
// Add to your mod configuration
public static final boolean DEBUG_MODE = true;

if (DEBUG_MODE) {
    System.out.println("API Request: " + requestBody);
    System.out.println("API Response: " + response.body());
}
```

## Support

- **Documentation**: This file and API_DOCUMENTATION.md
- **Issues**: GitHub Issues
- **Discord**: Community server
- **Email**: support@vonix.network

---

**Last Updated**: 2025-01-15
**API Version**: 1.0.0