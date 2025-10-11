/**
 * Example implementation for NRT Minecraft Mod
 * Vonix Network Integration
 * 
 * This example shows how to integrate the /vonixregister and /login commands
 * with the Vonix Network website API.
 */

package com.vonixnetwork.nrt.commands;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import net.minecraft.command.CommandBase;
import net.minecraft.command.CommandException;
import net.minecraft.command.ICommandSender;
import net.minecraft.entity.player.EntityPlayer;
import net.minecraft.server.MinecraftServer;
import net.minecraft.util.text.TextComponentString;
import net.minecraft.util.text.TextFormatting;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

public class VonixNetworkCommands extends CommandBase {
    
    // Configuration - these should be loaded from config file
    private static final String API_BASE_URL = "https://api.vonix.network/api";
    private static final String REGISTRATION_API_KEY = "your-registration-api-key-here";
    
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final Gson gson = new Gson();
    
    // Store player sessions (in production, use proper storage)
    private final Map<UUID, String> playerTokens = new HashMap<>();

    @Override
    public String getName() {
        return "vonix";
    }

    @Override
    public String getUsage(ICommandSender sender) {
        return "/vonixregister or /login <password>";
    }

    @Override
    public void execute(MinecraftServer server, ICommandSender sender, String[] args) throws CommandException {
        if (!(sender instanceof EntityPlayer)) {
            sender.sendMessage(new TextComponentString(TextFormatting.RED + "This command can only be used by players!"));
            return;
        }

        EntityPlayer player = (EntityPlayer) sender;
        
        if (args.length == 0 || "register".equals(args[0]) || "vonixregister".equals(args[0])) {
            handleRegistration(player);
        } else if ("login".equals(args[0]) && args.length >= 2) {
            String password = String.join(" ", java.util.Arrays.copyOfRange(args, 1, args.length));
            handleLogin(player, password);
        } else {
            player.sendMessage(new TextComponentString(TextFormatting.RED + "Usage: " + getUsage(sender)));
        }
    }

    /**
     * Handle /vonixregister command
     */
    private void handleRegistration(EntityPlayer player) {
        String username = player.getName();
        String uuid = player.getUniqueID().toString();

        // Send message immediately
        player.sendMessage(new TextComponentString(TextFormatting.YELLOW + "[Vonix] Generating registration code..."));

        // Make API call asynchronously to avoid blocking the server
        CompletableFuture.supplyAsync(() -> {
            try {
                return generateRegistrationCode(username, uuid);
            } catch (Exception e) {
                return "ERROR: " + e.getMessage();
            }
        }).thenAccept(result -> {
            // Execute on server thread
            player.getServer().addScheduledTask(() -> {
                if (result.startsWith("ERROR: ")) {
                    String error = result.substring(7);
                    if (error.contains("already registered")) {
                        player.sendMessage(new TextComponentString(TextFormatting.RED + "[Vonix] You are already registered!"));
                        player.sendMessage(new TextComponentString(TextFormatting.YELLOW + "[Vonix] Use /login <password> to log in."));
                    } else {
                        player.sendMessage(new TextComponentString(TextFormatting.RED + "[Vonix] Registration failed: " + error));
                    }
                } else {
                    player.sendMessage(new TextComponentString(TextFormatting.GREEN + "[Vonix] Registration code: " + TextFormatting.WHITE + result));
                    player.sendMessage(new TextComponentString(TextFormatting.GREEN + "[Vonix] Visit " + TextFormatting.WHITE + "https://vonix.network/register" + TextFormatting.GREEN + " to complete registration"));
                    player.sendMessage(new TextComponentString(TextFormatting.YELLOW + "[Vonix] Code expires in 10 minutes"));
                }
            });
        });
    }

    /**
     * Handle /login <password> command
     */
    private void handleLogin(EntityPlayer player, String password) {
        String username = player.getName();
        String uuid = player.getUniqueID().toString();

        // Send message immediately
        player.sendMessage(new TextComponentString(TextFormatting.YELLOW + "[Vonix] Logging in..."));

        // Make API call asynchronously
        CompletableFuture.supplyAsync(() -> {
            try {
                return authenticatePlayer(username, uuid, password);
            } catch (Exception e) {
                return new LoginResult(false, "ERROR: " + e.getMessage(), null, null);
            }
        }).thenAccept(result -> {
            // Execute on server thread
            player.getServer().addScheduledTask(() -> {
                if (!result.success) {
                    String error = result.message.startsWith("ERROR: ") ? result.message.substring(7) : result.message;
                    
                    if (error.contains("Account not found")) {
                        player.sendMessage(new TextComponentString(TextFormatting.RED + "[Vonix] No account found!"));
                        player.sendMessage(new TextComponentString(TextFormatting.YELLOW + "[Vonix] Use /vonixregister to create an account first."));
                    } else if (error.contains("Invalid password")) {
                        player.sendMessage(new TextComponentString(TextFormatting.RED + "[Vonix] Invalid password. Try again."));
                    } else {
                        player.sendMessage(new TextComponentString(TextFormatting.RED + "[Vonix] Login failed: " + error));
                    }
                } else {
                    // Store the JWT token for future API calls
                    playerTokens.put(player.getUniqueID(), result.token);
                    
                    player.sendMessage(new TextComponentString(TextFormatting.GREEN + "[Vonix] " + result.message));
                    player.sendMessage(new TextComponentString(TextFormatting.GREEN + "[Vonix] Welcome back, " + TextFormatting.WHITE + result.user.minecraft_username + TextFormatting.GREEN + "!"));
                    
                    // Apply any special permissions or ranks
                    if (result.user.donation_rank_id != null && !result.user.donation_rank_id.isEmpty()) {
                        applyDonationRank(player, result.user.donation_rank_id);
                    }
                    
                    // Show user info
                    if (result.user.total_donated > 0) {
                        player.sendMessage(new TextComponentString(TextFormatting.GOLD + "[Vonix] Thank you for donating $" + result.user.total_donated + "!"));
                    }
                }
            });
        });
    }

    /**
     * Check if player is registered
     */
    private RegistrationStatus checkRegistrationStatus(String uuid) throws IOException, InterruptedException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("minecraft_uuid", uuid);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/registration/check-registration"))
                .header("Content-Type", "application/json")
                .header("X-API-Key", REGISTRATION_API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonObject result = gson.fromJson(response.body(), JsonObject.class);
            boolean registered = result.get("registered").getAsBoolean();
            
            if (registered) {
                UserInfo user = gson.fromJson(result.get("user"), UserInfo.class);
                return new RegistrationStatus(true, user);
            } else {
                return new RegistrationStatus(false, null);
            }
        } else {
            JsonObject error = gson.fromJson(response.body(), JsonObject.class);
            throw new RuntimeException(error.get("error").getAsString());
        }
    }

    /**
     * Generate registration code via API
     */
    private String generateRegistrationCode(String username, String uuid) throws IOException, InterruptedException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("minecraft_username", username);
        requestBody.addProperty("minecraft_uuid", uuid);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/registration/generate-code"))
                .header("Content-Type", "application/json")
                .header("X-API-Key", REGISTRATION_API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonObject result = gson.fromJson(response.body(), JsonObject.class);
            return result.get("code").getAsString();
        } else {
            JsonObject error = gson.fromJson(response.body(), JsonObject.class);
            throw new RuntimeException(error.get("error").getAsString());
        }
    }

    /**
     * Authenticate player via API
     */
    private LoginResult authenticatePlayer(String username, String uuid, String password) throws IOException, InterruptedException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("minecraft_username", username);
        requestBody.addProperty("minecraft_uuid", uuid);
        requestBody.addProperty("password", password);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_BASE_URL + "/registration/minecraft-login"))
                .header("Content-Type", "application/json")
                .header("X-API-Key", REGISTRATION_API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(gson.toJson(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonObject result = gson.fromJson(response.body(), JsonObject.class);
            
            UserInfo user = gson.fromJson(result.get("user"), UserInfo.class);
            
            return new LoginResult(
                result.get("success").getAsBoolean(),
                result.get("message").getAsString(),
                result.get("token").getAsString(),
                user
            );
        } else {
            JsonObject error = gson.fromJson(response.body(), JsonObject.class);
            return new LoginResult(false, error.get("error").getAsString(), null, null);
        }
    }

    /**
     * Apply donation rank benefits to player
     */
    private void applyDonationRank(EntityPlayer player, String rankId) {
        // Example: Apply rank-specific permissions or effects
        switch (rankId.toLowerCase()) {
            case "supporter":
                player.sendMessage(new TextComponentString(TextFormatting.GREEN + "🌟 Supporter rank active!"));
                // Add supporter permissions
                break;
            case "patron":
                player.sendMessage(new TextComponentString(TextFormatting.BLUE + "💎 Patron rank active!"));
                // Add patron permissions
                break;
            case "champion":
                player.sendMessage(new TextComponentString(TextFormatting.LIGHT_PURPLE + "👑 Champion rank active!"));
                // Add champion permissions
                break;
            case "legend":
                player.sendMessage(new TextComponentString(TextFormatting.GOLD + "🏆 Legend rank active!"));
                // Add legend permissions
                break;
        }
    }

    /**
     * Get stored JWT token for player
     */
    public String getPlayerToken(UUID playerUuid) {
        return playerTokens.get(playerUuid);
    }

    /**
     * Remove stored token (on logout)
     */
    public void removePlayerToken(UUID playerUuid) {
        playerTokens.remove(playerUuid);
    }

    // Data classes
    private static class RegistrationStatus {
        final boolean registered;
        final UserInfo user;

        RegistrationStatus(boolean registered, UserInfo user) {
            this.registered = registered;
            this.user = user;
        }
    }

    private static class LoginResult {
        final boolean success;
        final String message;
        final String token;
        final UserInfo user;

        LoginResult(boolean success, String message, String token, UserInfo user) {
            this.success = success;
            this.message = message;
            this.token = token;
            this.user = user;
        }
    }

    private static class UserInfo {
        int id;
        String username;
        String minecraft_username;
        String minecraft_uuid;
        String role;
        double total_donated;
        String donation_rank_id;
        String donation_rank_expires_at;
    }
}

/**
 * Register the commands in your mod's main class:
 * 
 * @Mod.EventHandler
 * public void serverStarting(FMLServerStartingEvent event) {
 *     event.registerServerCommand(new VonixNetworkCommands());
 * }
 */