const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { getDatabase } = require('../database/init');
const { getSetting, setSetting } = require('../utils/settings');
const { startDiscordBot, reloadDiscordBot } = require('../services/discord');

const router = express.Router();

/**
 * Generate a secure 32-character API key
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

// GET /api/setup/status - returns if setup is required
router.get('/status', (req, res) => {
  try {
    const db = getDatabase();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const setupRequired = userCount === 0 || getSetting('setup_required', '1') === '1';

    res.json({ setup_required: !!setupRequired });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get setup status' });
  }
});

// POST /api/setup/init - initializes first admin and optional discord settings
// Body: { username, password, discord_bot_token?, discord_channel_id?, discord_webhook_url? }
router.post('/init', async (req, res) => {
  const { username, password, discord_bot_token, discord_channel_id, discord_webhook_url } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const db = getDatabase();

    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount > 0) {
      return res.status(400).json({ error: 'Setup already completed' });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (username, password, role, must_change_password)
        VALUES (?, ?, 'admin', 0)
      `).run(username, hashed);

      // Persist Discord settings if provided
      if (discord_bot_token) setSetting('DISCORD_BOT_TOKEN', discord_bot_token);
      if (discord_channel_id) setSetting('DISCORD_CHANNEL_ID', discord_channel_id);
      if (discord_webhook_url) setSetting('DISCORD_WEBHOOK_URL', discord_webhook_url);

      // Generate registration API key if not exists
      if (!getSetting('REGISTRATION_API_KEY')) {
        const apiKey = generateApiKey();
        setSetting('REGISTRATION_API_KEY', apiKey);
        console.log('🔑 Generated Registration API Key for Minecraft mod/plugin');
      }

      // Clear setup flag
      setSetting('setup_required', '0');
    });

    tx();

    // Start or reload discord bot if settings present
    if (discord_bot_token && discord_channel_id) {
      try {
        // Prefer reload to apply latest settings
        await reloadDiscordBot();
      } catch {
        await startDiscordBot();
      }
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Initialization failed' });
  }
});

module.exports = router;
