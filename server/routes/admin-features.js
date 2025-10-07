const express = require('express');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { getSetting, setSetting } = require('../utils/settings');

const router = express.Router();

function getFlag(key, defaultTrue = true) {
  const val = getSetting(key, null);
  if (val === null) return defaultTrue; // default enabled
  return val === '1' || val === 'true' || val === true;
}

// Protect all routes
router.use(authenticateToken, isAdmin);

// GET /api/admin/features
router.get('/', (req, res) => {
  try {
    const flags = {
      servers: getFlag('FEATURE_SERVERS_ENABLED', true),
      forum: getFlag('FEATURE_FORUM_ENABLED', true),
      social: getFlag('FEATURE_SOCIAL_ENABLED', true),
      messages: getFlag('FEATURE_MESSAGES_ENABLED', true),
      discord_chat: getFlag('FEATURE_DISCORD_CHAT_ENABLED', true)
    };
    res.json(flags);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load feature flags' });
  }
});

// POST /api/admin/features
// Body: { servers?: boolean, forum?: boolean, social?: boolean, messages?: boolean, discord_chat?: boolean }
router.post('/', (req, res) => {
  try {
    const { servers, forum, social, messages, discord_chat } = req.body;
    if (servers !== undefined) setSetting('FEATURE_SERVERS_ENABLED', servers ? '1' : '0');
    if (forum !== undefined) setSetting('FEATURE_FORUM_ENABLED', forum ? '1' : '0');
    if (social !== undefined) setSetting('FEATURE_SOCIAL_ENABLED', social ? '1' : '0');
    if (messages !== undefined) setSetting('FEATURE_MESSAGES_ENABLED', messages ? '1' : '0');
    if (discord_chat !== undefined) setSetting('FEATURE_DISCORD_CHAT_ENABLED', discord_chat ? '1' : '0');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update feature flags' });
  }
});

module.exports = router;
