const { getSetting } = require('../utils/settings');
const logger = require('../utils/logger');

/**
 * Middleware to validate registration API key
 * Protects the Minecraft mod/plugin registration endpoints
 */
function validateRegistrationApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['x-registration-key'];
  const expectedKey = getSetting('REGISTRATION_API_KEY');

  // If no key is configured, allow (backward compatibility)
  if (!expectedKey) {
    logger.warn('⚠️  Registration API key not configured - endpoint is unprotected!');
    return next();
  }

  // Validate API key
  if (!apiKey) {
    logger.warn(`Registration API: Missing API key from ${req.ip}`);
    return res.status(401).json({ 
      error: 'API key required',
      message: 'Please provide X-API-Key header'
    });
  }

  if (apiKey !== expectedKey) {
    logger.warn(`Registration API: Invalid API key from ${req.ip}`);
    return res.status(403).json({ 
      error: 'Invalid API key',
      message: 'The provided API key is incorrect'
    });
  }

  // Valid key - proceed
  logger.info(`Registration API: Valid request from ${req.ip}`);
  next();
}

module.exports = {
  validateRegistrationApiKey
};
