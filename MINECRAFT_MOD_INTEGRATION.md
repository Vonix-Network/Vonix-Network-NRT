# Minecraft Mod Integration Guide

This guide explains how to integrate the Vonix Network registration and login system with your Minecraft mod.

## Overview

The integration uses a two-step registration process:
1. Player uses `/vonixregister` command in Minecraft → receives a code
2. Player goes to the website and registers with the code + password
3. Player can then login in-game using `/login <password>` command

## Authentication

All mod endpoints require the `X-API-Key` header for security. This key is configured in your server's settings database under the `REGISTRATION_API_KEY` setting.

```
X-API-Key: your-secure-api-key-here
```

## API Endpoints

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.vonix.network/api`

---

## 1. Generate Registration Code

**Endpoint**: `POST /api/registration/generate-code`

**Use Case**: When player types `/vonixregister` in Minecraft

**Request Headers**:
```
Content-Type: application/json
X-API-Key: your-secure-api-key-here
```

**Request Body**:
```json
{
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response** (200 OK):
```json
{
  "code": "A3F5D9",
  "expires_in": 600,
  "minecraft_username": "PlayerName"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid username/UUID or account already registered
  ```json
  {
    "error": "This Minecraft account is already registered",
    "username": "PlayerName"
  }
  ```
- `401 Unauthorized`: Missing or invalid API key
- `500 Internal Server Error`: Server error

**Implementation Example (Java)**:
```java
public void registerCommand(Player player) {
    String username = player.getName();
    String uuid = player.getUniqueId().toString();
    
    JSONObject requestBody = new JSONObject();
    requestBody.put("minecraft_username", username);
    requestBody.put("minecraft_uuid", uuid);
    
    HttpURLConnection conn = (HttpURLConnection) new URL(API_BASE + "/registration/generate-code").openConnection();
    conn.setRequestMethod("POST");
    conn.setRequestProperty("Content-Type", "application/json");
    conn.setRequestProperty("X-API-Key", API_KEY);
    conn.setDoOutput(true);
    
    try (OutputStream os = conn.getOutputStream()) {
        os.write(requestBody.toString().getBytes());
    }
    
    if (conn.getResponseCode() == 200) {
        JSONObject response = new JSONObject(readResponse(conn));
        String code = response.getString("code");
        int expiresIn = response.getInt("expires_in");
        
        player.sendMessage("§a§lRegistration Code: §f§l" + code);
        player.sendMessage("§7Go to §bhttps://vonix.network/register §7and use this code");
        player.sendMessage("§7Code expires in " + (expiresIn / 60) + " minutes");
    } else {
        JSONObject error = new JSONObject(readErrorResponse(conn));
        player.sendMessage("§c" + error.getString("error"));
    }
}
```

---

## 2. Minecraft Mod Login

**Endpoint**: `POST /api/registration/login`

**Use Case**: When player types `/login <password>` in Minecraft after registering on website

**Request Headers**:
```
Content-Type: application/json
X-API-Key: your-secure-api-key-here
```

**Request Body**:
```json
{
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "password": "SecurePassword123"
}
```

**Important Notes**:
- Send the password as **plain text** (HTTPS encryption protects it in transit)
- Do NOT hash the password client-side
- The server will validate it against the stored bcrypt hash

**Success Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

**Error Responses**:
- `400 Bad Request`: Missing parameters or invalid UUID
  ```json
  {
    "error": "Minecraft UUID and password required"
  }
  ```
- `401 Unauthorized`: Invalid credentials or missing API key
  ```json
  {
    "error": "Invalid credentials",
    "message": "No account found for this Minecraft UUID. Please register on the website first."
  }
  ```
  or
  ```json
  {
    "error": "Invalid credentials",
    "message": "Incorrect password"
  }
  ```
- `500 Internal Server Error`: Server error

**Implementation Example (Java)**:
```java
public void loginCommand(Player player, String password) {
    String uuid = player.getUniqueId().toString();
    
    JSONObject requestBody = new JSONObject();
    requestBody.put("minecraft_uuid", uuid);
    requestBody.put("password", password);
    
    HttpURLConnection conn = (HttpURLConnection) new URL(API_BASE + "/registration/login").openConnection();
    conn.setRequestMethod("POST");
    conn.setRequestProperty("Content-Type", "application/json");
    conn.setRequestProperty("X-API-Key", API_KEY);
    conn.setDoOutput(true);
    
    try (OutputStream os = conn.getOutputStream()) {
        os.write(requestBody.toString().getBytes());
    }
    
    if (conn.getResponseCode() == 200) {
        JSONObject response = new JSONObject(readResponse(conn));
        String token = response.getString("token");
        JSONObject user = response.getJSONObject("user");
        
        // Store the token for future API calls
        playerTokens.put(player.getUniqueId(), token);
        
        player.sendMessage("§a§lSuccessfully logged in!");
        player.sendMessage("§7Welcome back, §b" + user.getString("username") + "§7!");
        
        // Handle donation rank if present
        if (!user.isNull("donation_rank_id")) {
            String rankId = user.getString("donation_rank_id");
            applyDonationRank(player, rankId);
        }
    } else {
        JSONObject error = new JSONObject(readErrorResponse(conn));
        player.sendMessage("§cLogin failed: " + error.getString("message"));
    }
}
```

---

## 3. Check Registration Code (Optional)

**Endpoint**: `GET /api/registration/check-code/:code`

**Use Case**: Validate if a code is still valid (useful for website validation)

**Example**:
```
GET /api/registration/check-code/A3F5D9
```

**Success Response** (200 OK):
```json
{
  "valid": true,
  "minecraft_username": "PlayerName",
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2025-10-11T15:30:00.000Z",
  "time_remaining": 450
}
```

---

## Security Best Practices

### 1. API Key Protection
- Store the API key securely (not in source code)
- Use environment variables or config files
- Never commit the API key to version control
- Rotate the key regularly

### 2. Password Handling
- **NEVER** log passwords
- Send passwords over HTTPS only
- Do NOT store passwords in memory longer than necessary
- Clear password variables after use

### 3. Token Management
- Store tokens securely (encrypted if possible)
- Set appropriate token expiration (default: 7 days)
- Implement token refresh mechanism if needed
- Clear tokens on logout

### 4. Rate Limiting
- The API has rate limiting enabled
- Login endpoint: 20 requests per 15 minutes
- Implement client-side cooldowns to prevent spam

---

## Complete Mod Implementation Example

```java
public class VonixAuthMod {
    private static final String API_BASE = "https://api.vonix.network/api";
    private static final String API_KEY = System.getenv("VONIX_API_KEY");
    private Map<UUID, String> playerTokens = new HashMap<>();
    
    // Command: /vonixregister
    @Command("vonixregister")
    public void onRegisterCommand(Player player) {
        if (playerTokens.containsKey(player.getUniqueId())) {
            player.sendMessage("§cYou are already logged in!");
            return;
        }
        
        try {
            JSONObject body = new JSONObject();
            body.put("minecraft_username", player.getName());
            body.put("minecraft_uuid", player.getUniqueId().toString());
            
            HttpResponse<String> response = sendPostRequest(
                "/registration/generate-code", 
                body.toString()
            );
            
            if (response.statusCode() == 200) {
                JSONObject data = new JSONObject(response.body());
                String code = data.getString("code");
                int expiresIn = data.getInt("expires_in");
                
                player.sendMessage("§8§m                                           ");
                player.sendMessage("§a§lVONIX NETWORK REGISTRATION");
                player.sendMessage("");
                player.sendMessage("§7Your registration code is:");
                player.sendMessage("§f§l" + code);
                player.sendMessage("");
                player.sendMessage("§71. Go to §bhttps://vonix.network/register");
                player.sendMessage("§72. Enter your code: §f" + code);
                player.sendMessage("§73. Create a password");
                player.sendMessage("§74. Return here and type: §e/login <password>");
                player.sendMessage("");
                player.sendMessage("§c⚠ Code expires in " + (expiresIn / 60) + " minutes!");
                player.sendMessage("§8§m                                           ");
            } else {
                handleErrorResponse(player, response);
            }
        } catch (Exception e) {
            player.sendMessage("§cAn error occurred. Please try again later.");
            logger.error("Registration error", e);
        }
    }
    
    // Command: /login <password>
    @Command("login")
    public void onLoginCommand(Player player, @Arg("password") String password) {
        if (playerTokens.containsKey(player.getUniqueId())) {
            player.sendMessage("§cYou are already logged in!");
            return;
        }
        
        try {
            JSONObject body = new JSONObject();
            body.put("minecraft_uuid", player.getUniqueId().toString());
            body.put("password", password);
            
            HttpResponse<String> response = sendPostRequest(
                "/registration/login", 
                body.toString()
            );
            
            if (response.statusCode() == 200) {
                JSONObject data = new JSONObject(response.body());
                String token = data.getString("token");
                JSONObject user = data.getJSONObject("user");
                
                playerTokens.put(player.getUniqueId(), token);
                
                player.sendMessage("§8§m                                           ");
                player.sendMessage("§a§lLOGIN SUCCESSFUL");
                player.sendMessage("");
                player.sendMessage("§7Welcome back, §b" + user.getString("username") + "§7!");
                
                if (!user.isNull("donation_rank_id")) {
                    String rankId = user.getString("donation_rank_id");
                    player.sendMessage("§7Your donation rank: §6" + rankId.toUpperCase());
                }
                
                player.sendMessage("§8§m                                           ");
                
                // Apply perks/ranks
                applyPlayerPerks(player, user);
            } else {
                handleErrorResponse(player, response);
            }
        } catch (Exception e) {
            player.sendMessage("§cAn error occurred. Please try again later.");
            logger.error("Login error", e);
        } finally {
            // Clear password from memory
            password = null;
        }
    }
    
    // Command: /logout
    @Command("logout")
    public void onLogoutCommand(Player player) {
        if (!playerTokens.containsKey(player.getUniqueId())) {
            player.sendMessage("§cYou are not logged in!");
            return;
        }
        
        playerTokens.remove(player.getUniqueId());
        player.sendMessage("§aSuccessfully logged out!");
    }
    
    private HttpResponse<String> sendPostRequest(String endpoint, String body) throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + endpoint))
            .header("Content-Type", "application/json")
            .header("X-API-Key", API_KEY)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }
    
    private void handleErrorResponse(Player player, HttpResponse<String> response) {
        try {
            JSONObject error = new JSONObject(response.body());
            String message = error.optString("message", error.getString("error"));
            player.sendMessage("§c" + message);
        } catch (Exception e) {
            player.sendMessage("§cAn error occurred. Please try again later.");
        }
    }
    
    private void applyPlayerPerks(Player player, JSONObject user) {
        // Implement your perk system here
        // Examples: 
        // - Apply donation ranks
        // - Grant permissions
        // - Sync with PermissionsEx/LuckPerms
        // - Give items/kits
        // - Set prefix/suffix
    }
}
```

---

## Testing

### Using cURL (Linux/Mac):

**Generate Code**:
```bash
curl -X POST https://api.vonix.network/api/registration/generate-code \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "minecraft_username": "TestPlayer",
    "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Login**:
```bash
curl -X POST https://api.vonix.network/api/registration/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "password": "TestPassword123"
  }'
```

### Using Postman:

1. Create a new POST request
2. Set URL: `https://api.vonix.network/api/registration/login`
3. Add Headers:
   - `Content-Type`: `application/json`
   - `X-API-Key`: `your-api-key`
4. Set Body (raw JSON):
   ```json
   {
     "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
     "password": "TestPassword123"
   }
   ```

---

## Troubleshooting

### Error: "API key required"
- Ensure you're sending the `X-API-Key` header
- Check that the key matches the server configuration
- Verify the header name is exactly `X-API-Key` (case-sensitive)

### Error: "Invalid Minecraft UUID format"
- Ensure UUID is in standard format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- UUID should be lowercase hexadecimal with dashes

### Error: "No account found for this Minecraft UUID"
- Player hasn't completed registration on the website
- Check if the UUID matches the one used during registration

### Error: "Incorrect password"
- Password is case-sensitive
- Ensure password is sent as plain text (not hashed)
- Player may need to reset password on website

### Connection Issues
- Verify the API base URL is correct
- Ensure HTTPS is used in production
- Check firewall/network settings
- Verify server is running and accessible

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Vonix-Network/vonix-network-community
- Discord: https://discord.gg/vonix-network
- Email: support@vonix.network

---

## License

This integration guide is part of the Vonix Network Community Platform.
See LICENSE file for details.
