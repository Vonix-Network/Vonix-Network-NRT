const logger = require('./logger');

/**
 * Route error handler utility
 * Logs errors and sends appropriate responses
 */
function handleRouteError(error, res, message = 'An error occurred', statusCode = 500) {
  // Log the error with stack trace
  logger.error(`Route error: ${message}`, {
    error: error.message,
    stack: error.stack,
    statusCode
  });

  // Send error response (don't leak error details in production)
  const errorResponse = {
    error: message
  };

  // Include error details in development
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.details = error.message;
  }

  res.status(statusCode).json(errorResponse);
}

/**
 * Log route info
 */
function logRouteInfo(message, data = {}) {
  logger.info(message, data);
}

/**
 * Log route debug info
 */
function logRouteDebug(message, data = {}) {
  logger.debug(message, data);
}

module.exports = {
  handleRouteError,
  logRouteInfo,
  logRouteDebug
};
