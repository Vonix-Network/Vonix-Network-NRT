const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getSetting, setSetting, getSettings } = require('../utils/settings');
const { startDiscordBot, stopDiscordBot, reloadDiscordBot, loadDiscordConfig, getDiscordClient } = require('../services/discord');

const router = express.Router();

// All routes require admin
router.use(authenticateToken, isAdmin);

// GET /api/admin/discord/settings
router.get('/settings', (req, res) => {
  const settings = getSettings(['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID', 'DISCORD_WEBHOOK_URL']);
  // Do not return token in plain text
  const tokenMasked = settings.DISCORD_BOT_TOKEN ? `${settings.DISCORD_BOT_TOKEN.slice(0, 4)}***${settings.DISCORD_BOT_TOKEN.slice(-4)}` : null;
  res.json({
    token: tokenMasked,
    channel_id: settings.DISCORD_CHANNEL_ID || null,
    webhook_url: settings.DISCORD_WEBHOOK_URL || null,
    running: !!getDiscordClient()
  });
});

// POST /api/admin/discord/settings
router.post('/settings', async (req, res) => {
  const { token, channel_id, webhook_url } = req.body;

  if (token !== undefined) setSetting('DISCORD_BOT_TOKEN', token || '');
  if (channel_id !== undefined) setSetting('DISCORD_CHANNEL_ID', channel_id || '');
  if (webhook_url !== undefined) setSetting('DISCORD_WEBHOOK_URL', webhook_url || '');

  // Reload bot to apply changes
  await reloadDiscordBot();

  res.json({ success: true });
});

// POST /api/admin/discord/start
router.post('/start', async (req, res) => {
  const bot = await startDiscordBot();
  res.json({ success: !!bot });
});

// POST /api/admin/discord/stop
router.post('/stop', async (req, res) => {
  await stopDiscordBot();
  res.json({ success: true });
});

// POST /api/admin/discord/reload
router.post('/reload', async (req, res) => {
  const bot = await reloadDiscordBot();
  res.json({ success: !!bot });
});

module.exports = router;
