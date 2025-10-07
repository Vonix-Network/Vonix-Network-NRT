const { Client, GatewayIntentBits } = require('discord.js');
const { getDatabase } = require('../database/init');
const { getSetting } = require('../utils/settings');
const logger = require('../utils/logger');

let discordClient = null;
let discordConfig = { token: null, channelId: null };

function loadDiscordConfig() {
  // Prefer DB settings; fallback to env
  const token = getSetting('DISCORD_BOT_TOKEN', process.env.DISCORD_BOT_TOKEN || null);
  const channelId = getSetting('DISCORD_CHANNEL_ID', process.env.DISCORD_CHANNEL_ID || null);
  const webhook = getSetting('DISCORD_WEBHOOK_URL', process.env.DISCORD_WEBHOOK_URL || null);
  discordConfig = { token, channelId, webhook };
  return discordConfig;
}

async function startDiscordBot() {
  const { token, channelId } = loadDiscordConfig();

  if (!token || !channelId) {
    logger.warn('Discord bot token or channel ID not configured. Chat feature will not work.');
    return null;
  }

  // If already started, do nothing
  if (discordClient) {
    logger.info('Discord bot already running.');
    return discordClient;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on('ready', () => {
    logger.info(`Discord bot logged in as ${client.user.tag}`);
  });
  client.on('clientReady', () => {
    logger.info(`Discord bot (clientReady) logged in as ${client.user.tag}`);
  });

  client.on('messageCreate', (message) => {
    // Only process messages from the configured channel
    if (message.channelId !== channelId) return;

    // Skip messages sent by THIS bot to avoid echo loops
    if (message.author.id === client.user.id) return;

    // Skip webhook messages that originated from the website (they have [WEB] prefix)
    if (message.author.username && message.author.username.startsWith('[WEB]')) {
      logger.debug(`Skipping webhook message from: ${message.author.username}`);
      return;
    }

    // Skip messages with no content, no embeds, and no attachments
    if (!message.content && message.embeds.length === 0 && message.attachments.size === 0) return;

    logger.debug(`New Discord message from ${message.author.username}`);

    // Process embeds if they exist
    const embeds = message.embeds.map(embed => ({
      title: embed.title || null,
      description: embed.description || null,
      url: embed.url || null,
      color: embed.color || null,
      thumbnail: embed.thumbnail?.url || null,
      image: embed.image?.url || null,
      author: embed.author ? {
        name: embed.author.name,
        iconURL: embed.author.iconURL,
        url: embed.author.url
      } : null,
      fields: embed.fields || []
    }));

    // Process attachments (images, files, etc.)
    const attachments = Array.from(message.attachments.values()).map(attachment => ({
      id: attachment.id,
      filename: attachment.name,
      url: attachment.url,
      proxy_url: attachment.proxyURL,
      size: attachment.size,
      width: attachment.width || null,
      height: attachment.height || null,
      content_type: attachment.contentType || null
    }));

    // Get Discord avatar URL
    const discordAvatar = message.author.displayAvatarURL({ dynamic: true, size: 64 });
    
    const chatMessage = {
      id: message.id,
      discord_message_id: message.id,
      author_name: message.author.username || message.author.displayName || 'Unknown',
      author_avatar: discordAvatar,
      content: message.content || '',
      embeds: embeds.length > 0 ? JSON.stringify(embeds) : null,
      attachments: attachments.length > 0 ? JSON.stringify(attachments) : null,
      timestamp: message.createdAt.toISOString()
    };

    // Save to database
    let db;
    try {
      db = getDatabase();
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO chat_messages (discord_message_id, author_name, author_avatar, content, embeds, attachments, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        chatMessage.discord_message_id,
        chatMessage.author_name,
        chatMessage.author_avatar,
        chatMessage.content,
        chatMessage.embeds,
        chatMessage.attachments,
        chatMessage.timestamp
      );

      // Only broadcast if the message was actually inserted (not a duplicate)
      if (result.changes > 0) {
        // Get the full message from database with the generated ID
        const savedMessage = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(result.lastInsertRowid);
        
        // Broadcast to WebSocket clients
        if (global.broadcastChatMessage && savedMessage) {
          global.broadcastChatMessage(savedMessage);
        }
      }
    } catch (error) {
      logger.error('Error saving chat message:', error);
    } finally {
      // Do not close the singleton DB connection
    }
  });

  client.on('error', (error) => {
    logger.error('Discord bot error:', error);
  });

  try {
    await client.login(token);
  } catch (err) {
    logger.error('Failed to login to Discord:', err.message);
    return null;
  }

  discordClient = client;
  return client;
}

async function stopDiscordBot() {
  if (discordClient) {
    try {
      await discordClient.destroy();
      logger.info('Discord bot stopped');
    } catch (e) {
      logger.warn('Error while stopping Discord bot:', e.message);
    }
    discordClient = null;
  }
}

async function reloadDiscordBot() {
  await stopDiscordBot();
  return startDiscordBot();
}

function getDiscordClient() {
  return discordClient;
}

module.exports = {
  startDiscordBot,
  stopDiscordBot,
  reloadDiscordBot,
  getDiscordClient,
  loadDiscordConfig
};
