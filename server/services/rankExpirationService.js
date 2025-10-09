const { getDatabase } = require('../database/init');
const logger = require('../utils/logger');

class RankExpirationService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    // Check every hour for expired ranks
    this.checkInterval = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  start() {
    if (this.isRunning) {
      logger.warn('Rank expiration service is already running');
      return;
    }

    logger.info('🕐 Starting rank expiration service...');
    this.isRunning = true;
    
    // Run immediately on start
    this.checkExpiredRanks();
    
    // Then run on interval
    this.intervalId = setInterval(() => {
      this.checkExpiredRanks();
    }, this.checkInterval);
    
    logger.info('✅ Rank expiration service started');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Rank expiration service is not running');
      return;
    }

    logger.info('🛑 Stopping rank expiration service...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isRunning = false;
    logger.info('✅ Rank expiration service stopped');
  }

  async checkExpiredRanks() {
    const db = getDatabase();
    
    try {
      logger.info('🔍 Checking for expired donation ranks...');
      
      // Find all users with expired ranks
      const expiredUsers = db.prepare(`
        SELECT 
          id, username, donation_rank_id, donation_rank_expires_at
        FROM users 
        WHERE donation_rank_id IS NOT NULL 
          AND donation_rank_expires_at IS NOT NULL 
          AND donation_rank_expires_at < datetime('now')
      `).all();

      if (expiredUsers.length === 0) {
        logger.info('✅ No expired ranks found');
        return;
      }

      logger.info(`⏰ Found ${expiredUsers.length} expired ranks to process`);

      db.exec('BEGIN TRANSACTION');

      let processedCount = 0;

      for (const user of expiredUsers) {
        try {
          // Remove the expired rank
          db.prepare(`
            UPDATE users 
            SET donation_rank_id = NULL, 
                donation_rank_expires_at = NULL,
                donation_rank_granted_by = NULL
            WHERE id = ?
          `).run(user.id);

          // Log the expiration in history
          db.prepare(`
            INSERT INTO donation_rank_history (
              user_id, old_rank_id, new_rank_id, old_expires_at, new_expires_at,
              action_type, reason, granted_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            user.id,
            user.donation_rank_id,
            null,
            user.donation_rank_expires_at,
            null,
            'expired',
            'Rank expired automatically',
            null
          );

          processedCount++;
          logger.info(`⏰ Expired rank for user ${user.username} (${user.donation_rank_id})`);
        } catch (error) {
          logger.error(`❌ Failed to expire rank for user ${user.username}:`, error);
        }
      }

      db.exec('COMMIT');
      
      logger.info(`✅ Successfully processed ${processedCount} expired ranks`);
      
      // Optionally, you could add notifications or email alerts here
      if (processedCount > 0) {
        this.notifyAdminsOfExpiredRanks(processedCount);
      }

    } catch (error) {
      db.exec('ROLLBACK');
      logger.error('❌ Error checking expired ranks:', error);
    }
  }

  notifyAdminsOfExpiredRanks(count) {
    // This could be extended to send email notifications or Discord messages
    logger.info(`📧 ${count} ranks expired - consider notifying admins`);
  }

  // Manual method to check and expire ranks immediately
  async forceCheck() {
    logger.info('🔄 Force checking expired ranks...');
    await this.checkExpiredRanks();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      nextCheck: this.intervalId ? new Date(Date.now() + this.checkInterval) : null
    };
  }

  // Update check interval (in minutes)
  setCheckInterval(minutes) {
    if (minutes < 1) {
      throw new Error('Check interval must be at least 1 minute');
    }

    const newInterval = minutes * 60 * 1000;
    const wasRunning = this.isRunning;

    if (wasRunning) {
      this.stop();
    }

    this.checkInterval = newInterval;
    logger.info(`⚙️ Updated rank expiration check interval to ${minutes} minutes`);

    if (wasRunning) {
      this.start();
    }
  }
}

// Create singleton instance
const rankExpirationService = new RankExpirationService();

module.exports = rankExpirationService;
