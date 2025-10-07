const express = require('express');
const router = express.Router();
const { getDatabase } = require('../database/init');
const { getCacheStats } = require('../middleware/cache');

// Basic health check
router.get('/', async (req, res) => {
  try {
    const db = getDatabase();
    let dbStatus = 'ok';
    let dbError = null;
    
    // Test database connection
    try {
      db.prepare('SELECT 1 as test').get();
    } catch (error) {
      dbStatus = 'error';
      dbError = error.message;
    }
    
    // Check Discord bot status
    const discordStatus = global.discordBot?.isReady?.() ? 'connected' : 'disconnected';
    
    // Check WebSocket server
    const wsClients = global.wss?.clients?.size || 0;
    const wsStatus = global.wss ? 'running' : 'offline';
    
    // Get cache statistics
    const cacheStats = getCacheStats();
    
    // Overall status
    const overallStatus = dbStatus === 'ok' ? 'healthy' : 'degraded';
    
    res.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: {
          status: dbStatus,
          error: dbError
        },
        discord: {
          status: discordStatus
        },
        websocket: {
          status: wsStatus,
          clients: wsClients
        },
        cache: {
          keys: cacheStats.keys,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate: cacheStats.hits > 0 
            ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
            : '0%'
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed health check (for monitoring tools)
router.get('/detailed', async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get database statistics
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const forumTopicCount = db.prepare('SELECT COUNT(*) as count FROM forum_topics').get().count;
    const forumPostCount = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE deleted = 0').get().count;
    const serverCount = db.prepare('SELECT COUNT(*) as count FROM servers').get().count;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      statistics: {
        users: userCount,
        forumTopics: forumTopicCount,
        forumPosts: forumPostCount,
        servers: serverCount
      },
      uptime: {
        seconds: Math.floor(process.uptime()),
        formatted: formatUptime(process.uptime())
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// Format uptime in human-readable format
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

module.exports = router;
