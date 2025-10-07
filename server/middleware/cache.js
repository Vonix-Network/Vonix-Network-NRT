const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// Create cache instance
// stdTTL: default time to live in seconds
// checkperiod: period in seconds for automatic delete check
const cache = new NodeCache({ 
  stdTTL: 300, // 5 minutes default
  checkperiod: 60, // Check for expired keys every 60 seconds
  useClones: false // Don't clone objects (better performance)
});

// Log cache stats periodically
cache.on('expired', (key, value) => {
  logger.debug(`Cache key expired: ${key}`);
});

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (optional, defaults to 300)
 * @returns {Function} Express middleware
 */
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Create cache key from URL and query params
    const key = `__express__${req.originalUrl || req.url}`;
    
    // Try to get cached response
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      logger.debug(`Cache hit: ${key}`);
      return res.json(cachedResponse);
    }
    
    logger.debug(`Cache miss: ${key}`);
    
    // Store original res.json method
    res.originalJson = res.json;
    
    // Override res.json to cache the response
    res.json = function(data) {
      // Cache the response
      cache.set(key, data, duration || 300);
      
      // Call original json method
      res.originalJson(data);
    };
    
    next();
  };
};

/**
 * Clear cache by pattern
 * @param {string|RegExp} pattern - Pattern to match cache keys
 */
const clearCache = (pattern) => {
  const keys = cache.keys();
  let cleared = 0;
  
  keys.forEach(key => {
    if (typeof pattern === 'string') {
      if (key.includes(pattern)) {
        cache.del(key);
        cleared++;
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(key)) {
        cache.del(key);
        cleared++;
      }
    }
  });
  
  logger.info(`Cleared ${cleared} cache entries matching pattern: ${pattern}`);
  return cleared;
};

/**
 * Clear all cache
 */
const clearAllCache = () => {
  const count = cache.keys().length;
  cache.flushAll();
  logger.info(`Cleared all cache (${count} entries)`);
  return count;
};

/**
 * Get cache statistics
 */
const getCacheStats = () => {
  return cache.getStats();
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearAllCache,
  getCacheStats,
  cache
};
