# Quick Start: Minecraft Mod Login Integration

This is a quick reference for integrating the login endpoint into your Minecraft mod. For detailed documentation, see `MINECRAFT_MOD_INTEGRATION.md`.

## Setup (5 minutes)

### 1. Get Your API Key
Contact your server administrator or set it in the database:
```sql
INSERT INTO settings (key, value) VALUES ('REGISTRATION_API_KEY', 'your-secure-api-key-here');
```

### 2. Add to Your Mod Config
```properties
# config.properties
vonix.api.url=https://api.vonix.network/api
vonix.api.key=your-api-key-here
```

## Implementation (2 Commands)

### Command 1: `/vonixregister`
```java
@Command("vonixregister")
public void register(Player player) {
    String body = String.format(
        "{\"minecraft_username\":\"%s\",\"minecraft_uuid\":\"%s\"}",
        player.getName(),
        player.getUniqueId().toString()
    );
    
    String response = httpPost("/registration/generate-code", body);
    JSONObject json = new JSONObject(response);
    
    player.sendMessage("§aYour code: §f" + json.getString("code"));
    player.sendMessage("§7Register at: §bhttps://vonix.network/register");
}
```

### Command 2: `/login <password>` ← NEW!
```java
@Command("login")
public void login(Player player, String password) {
    String body = String.format(
        "{\"minecraft_uuid\":\"%s\",\"password\":\"%s\"}",
        player.getUniqueId().toString(),
        password
    );
    
    String response = httpPost("/registration/login", body);
    JSONObject json = new JSONObject(response);
    
    if (json.getBoolean("success")) {
        String token = json.getString("token");
        JSONObject user = json.getJSONObject("user");
        
        // Store token
        playerTokens.put(player.getUniqueId(), token);
        
        player.sendMessage("§aLogged in as: §f" + user.getString("username"));
        
        // Apply ranks/perks
        if (!user.isNull("donation_rank_id")) {
            applyRank(player, user.getString("donation_rank_id"));
        }
    } else {
        player.sendMessage("§cLogin failed!");
    }
}
```

## HTTP Helper Method
```java
private String httpPost(String endpoint, String body) {
    try {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_URL + endpoint))
            .header("Content-Type", "application/json")
            .header("X-API-Key", API_KEY)
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();
        
        HttpResponse<String> response = client.send(request, 
            HttpResponse.BodyHandlers.ofString());
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("HTTP " + response.statusCode());
        }
        
        return response.body();
    } catch (Exception e) {
        throw new RuntimeException("API request failed", e);
    }
}
```

## API Endpoint
```
POST https://api.vonix.network/api/registration/login
```

**Headers**:
```
Content-Type: application/json
X-API-Key: your-api-key-here
```

**Request Body**:
```json
{
  "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
  "password": "PlayerPassword123"
}
```

**Success Response**:
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

**Error Response**:
```json
{
  "error": "Invalid credentials",
  "message": "Incorrect password"
}
```

## Testing with cURL
```bash
curl -X POST https://api.vonix.network/api/registration/login \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "minecraft_uuid": "550e8400-e29b-41d4-a716-446655440000",
    "password": "TestPassword123"
  }'
```

## Flow Diagram
```
Player                 Mod                    API                  Website
  |                     |                      |                       |
  |  /vonixregister     |                      |                       |
  |-------------------->|                      |                       |
  |                     | POST /generate-code  |                       |
  |                     |--------------------->|                       |
  |                     |<---------------------|                       |
  |    "Code: A3F5D9"   |                      |                       |
  |<--------------------|                      |                       |
  |                     |                      |                       |
  |   Go to website     |                      |                       |
  |-------------------------------------------------------------->     |
  |   Enter code + pwd  |                      |                       |
  |-------------------------------------------------------------->     |
  |                     |                      |  POST /register       |
  |                     |                      |<----------------------|
  |                     |                      |---------------------->|
  |                     |                      |   Account created     |
  |                     |                      |                       |
  |  /login password    |                      |                       |
  |-------------------->|                      |                       |
  |                     | POST /login          |                       |
  |                     |--------------------->|                       |
  |                     |<---------------------|                       |
  |                     |   Token + user data  |                       |
  |   "Logged in!"      |                      |                       |
  |<--------------------|                      |                       |
  |   [Apply perks]     |                      |                       |
```

## Common Issues

**"API key required"**
→ Add `X-API-Key` header to request

**"Invalid Minecraft UUID format"**
→ UUID must be: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (lowercase)

**"No account found for this Minecraft UUID"**
→ Player must register on website first

**"Incorrect password"**
→ Password is case-sensitive, send as plain text

## Next Steps

1. ✅ Add the 2 commands to your mod
2. ✅ Configure API URL and key
3. ✅ Test with a real player account
4. ✅ Handle errors gracefully
5. ✅ Add token storage
6. ✅ Implement rank/perk application

## Full Documentation
- 📚 Detailed guide: `MINECRAFT_MOD_INTEGRATION.md`
- 📖 API docs: `API_DOCUMENTATION.md`
- 📝 Implementation summary: `MINECRAFT_LOGIN_IMPLEMENTATION.md`

## Support
- GitHub: https://github.com/Vonix-Network/vonix-network-community
- Discord: https://discord.gg/vonix-network

---
**Last Updated**: 2025-10-11  
**Status**: ✅ Production Ready
