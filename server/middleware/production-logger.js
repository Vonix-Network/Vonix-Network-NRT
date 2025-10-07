const logger = require('../utils/logger');

/**
 * Production-ready logging middleware
 * Replaces console.log/error calls with proper Winston logging
 */

/**
 * Enhanced error handler for routes
 */
function createRouteErrorHandler(routeName) {
  return (error, res, customMessage = null, statusCode = 500) => {
    const message = customMessage || 'An error occurred';
    
    // Log with context
    logger.error(`Route error in ${routeName}`, {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      statusCode,
      route: routeName
    });

    // Response (don't leak sensitive info in production)
    const response = { error: message };
    
    if (process.env.NODE_ENV === 'development') {
      response.details = error.message;
      response.route = routeName;
    }

    res.status(statusCode).json(response);
  };
}

/**
 * Log successful operations
 */
function logSuccess(operation, data = {}) {
  logger.info(`Success: ${operation}`, data);
}

/**
 * Log warnings
 */
function logWarning(message, data = {}) {
  logger.warn(message, data);
}

/**
 * Log debug information (only in development)
 */
function logDebug(message, data = {}) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, data);
  }
}

/**
 * Middleware to log all requests in production
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP request failed', logData);
    } else if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('HTTP request', logData);
    }
  });

  next();
}

/**
 * Security event logger
 */
function logSecurityEvent(event, details = {}) {
  logger.warn(`Security event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
    severity: 'security'
  });
}

/**
 * Database operation logger
 */
function logDatabaseOperation(operation, details = {}) {
  logger.debug(`Database: ${operation}`, details);
}

/**
 * Performance logger for slow operations
 */
function logPerformance(operation, duration, threshold = 1000) {
  if (duration > threshold) {
    logger.warn(`Slow operation: ${operation}`, {
      duration: `${duration}ms`,
      threshold: `${threshold}ms`
    });
  } else {
    logger.debug(`Performance: ${operation}`, { duration: `${duration}ms` });
  }
}

module.exports = {
  createRouteErrorHandler,
  logSuccess,
  logWarning,
  logDebug,
  requestLogger,
  logSecurityEvent,
  logDatabaseOperation,
  logPerformance
};
