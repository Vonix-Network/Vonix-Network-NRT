const express = require('express');
const { getSetting } = require('../utils/settings');

const router = express.Router();

function getFlag(key, defaultTrue = true) {
  const val = getSetting(key, null);
  if (val === null) return defaultTrue; // default enabled
  return val === '1' || val === 'true' || val === true;
}

// GET /api/features - public feature flags
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to load features' });
  }
});

module.exports = router;
