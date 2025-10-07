const logger = require('./logger');

/**
 * Validate environment variables
 * Exits process if critical variables are missing or invalid
 */
function validateEnvironment() {
  const errors = [];
  const warnings = [];
  
  // Required variables
  const requiredVars = ['JWT_SECRET', 'PORT', 'DATABASE_PATH'];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });
  
  // Validate JWT_SECRET is not default
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this') {
    errors.push('JWT_SECRET must be changed from the default value!');
    errors.push('Generate a secure secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters for security');
  }
  
  // Validate PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`Invalid PORT value: ${process.env.PORT}. Must be between 1 and 65535`);
    }
  }
  
  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(`Unknown NODE_ENV: ${process.env.NODE_ENV}. Expected: ${validEnvs.join(', ')}`);
  }
  
  // Validate Discord configuration (optional but warn if incomplete)
  const hasDiscordToken = !!process.env.DISCORD_BOT_TOKEN;
  const hasDiscordChannel = !!process.env.DISCORD_CHANNEL_ID;
  const hasDiscordWebhook = !!process.env.DISCORD_WEBHOOK_URL;
  
  if ((hasDiscordToken || hasDiscordChannel || hasDiscordWebhook) && 
      !(hasDiscordToken && hasDiscordChannel)) {
    warnings.push('Discord configuration incomplete. Need both DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID for live chat');
  }
  
  // Validate CLIENT_URL format
  if (process.env.CLIENT_URL) {
    try {
      new URL(process.env.CLIENT_URL);
    } catch (error) {
      warnings.push(`Invalid CLIENT_URL format: ${process.env.CLIENT_URL}`);
    }
  }
  
  // Report findings
  if (errors.length > 0) {
    console.error('\n❌ Environment Validation FAILED\n');
    errors.forEach(error => console.error(`  ✗ ${error}`));
    console.error('\nPlease fix the errors in your .env file and try again.\n');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Validation Warnings\n');
    warnings.forEach(warning => console.warn(`  ⚠  ${warning}`));
    console.warn('');
  }
  
  // Log success
  const envName = process.env.NODE_ENV || 'development';
  logger.info(`✅ Environment validation passed (${envName} mode)`);
  
  return true;
}

/**
 * Get environment configuration summary
 */
function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    hasDiscord: !!(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_CHANNEL_ID),
    hasSentry: !!process.env.SENTRY_DSN,
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
  };
}

module.exports = {
  validateEnvironment,
  getEnvironmentInfo
};
