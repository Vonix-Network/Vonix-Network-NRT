const logger = require('../utils/logger');

/**
 * Run database migrations for new features
 */
function runMigrations(db) {
  logger.info('🔄 Running database migrations...');

  try {
    // Migration: Add email column to users table
    const usersTableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasEmailColumn = usersTableInfo.some(col => col.name === 'email');
    const hasAvatarColumn = usersTableInfo.some(col => col.name === 'avatar_url');
    const hasReputationColumn = usersTableInfo.some(col => col.name === 'reputation');
    const hasPostCountColumn = usersTableInfo.some(col => col.name === 'post_count');
    const hasLastSeenColumn = usersTableInfo.some(col => col.name === 'last_seen_at');

    if (!hasEmailColumn) {
      logger.info('📧 Adding email column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN email TEXT');
      // Create a unique index instead of UNIQUE constraint (SQLite limitation)
      try {
        db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      } catch (e) {
        // Index may already exist, ignore
      }
      logger.info('✅ Email column added');
    }

    if (!hasAvatarColumn) {
      logger.info('🖼️ Adding avatar_url column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
      logger.info('✅ Avatar column added');
    }

    if (!hasReputationColumn) {
      logger.info('⭐ Adding reputation column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN reputation INTEGER DEFAULT 0');
      logger.info('✅ Reputation column added');
    }

    if (!hasPostCountColumn) {
      logger.info('📊 Adding post_count column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN post_count INTEGER DEFAULT 0');
      logger.info('✅ Post count column added');
    }

    if (!hasLastSeenColumn) {
      logger.info('👁️ Adding last_seen_at column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN last_seen_at DATETIME');
      logger.info('✅ Last seen column added');
    }

    // Migration: Add banner and bio enhancements to user_profiles
    const profilesTableInfo = db.prepare("PRAGMA table_info(user_profiles)").all();
    const hasCustomBanner = profilesTableInfo.some(col => col.name === 'custom_banner');
    const hasAvatarBorder = profilesTableInfo.some(col => col.name === 'avatar_border');
    const hasTitle = profilesTableInfo.some(col => col.name === 'title');

    if (!hasCustomBanner) {
      logger.info('🎨 Adding custom_banner column to user_profiles...');
      db.exec('ALTER TABLE user_profiles ADD COLUMN custom_banner TEXT');
      logger.info('✅ Custom banner column added');
    }

    if (!hasAvatarBorder) {
      logger.info('🖼️ Adding avatar_border column to user_profiles...');
      db.exec('ALTER TABLE user_profiles ADD COLUMN avatar_border TEXT');
      logger.info('✅ Avatar border column added');
    }

    if (!hasTitle) {
      logger.info('🏷️ Adding title column to user_profiles...');
      db.exec('ALTER TABLE user_profiles ADD COLUMN title TEXT');
      logger.info('✅ Title column added');
    }

    // Create user_badges table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        badge_type TEXT NOT NULL,
        badge_name TEXT NOT NULL,
        badge_description TEXT,
        badge_icon TEXT,
        badge_color TEXT,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create user_activity_stats table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_activity_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        topics_created INTEGER DEFAULT 0,
        posts_created INTEGER DEFAULT 0,
        likes_received INTEGER DEFAULT 0,
        likes_given INTEGER DEFAULT 0,
        best_answers INTEGER DEFAULT 0,
        days_active INTEGER DEFAULT 0,
        last_post_at DATETIME,
        join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create user_reputation_log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_reputation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        points INTEGER NOT NULL,
        reason TEXT,
        related_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    logger.info('✅ user_activity_stats and reputation_log tables ready');

    // Create user_achievements table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        achievement_key TEXT NOT NULL,
        achievement_name TEXT NOT NULL,
        achievement_description TEXT,
        achievement_icon TEXT,
        achievement_rarity TEXT DEFAULT 'common',
        points INTEGER DEFAULT 0,
        unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, achievement_key)
      )
    `);
    logger.info('✅ user_achievements table ready');

    // Create post_votes table for upvote/downvote system
    db.exec(`
      CREATE TABLE IF NOT EXISTS post_votes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(post_id, user_id)
      )
    `);
    logger.info('✅ post_votes table ready');

    // Create indexes for achievements and badges
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity_stats(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_votes_post ON post_votes(post_id);
      CREATE INDEX IF NOT EXISTS idx_post_votes_user ON post_votes(user_id);
    `);

    // Add email_notifications column to forum_subscriptions if it doesn't exist
    const subscriptionsInfo = db.prepare("PRAGMA table_info(forum_subscriptions)").all();
    const hasEmailNotifications = subscriptionsInfo.some(col => col.name === 'email_notifications');

    if (!hasEmailNotifications) {
      logger.info('📧 Adding email_notifications to forum_subscriptions...');
      db.exec('ALTER TABLE forum_subscriptions ADD COLUMN email_notifications INTEGER DEFAULT 1');
      logger.info('✅ Email notifications column added');
    }

    // Create moderator system tables
    logger.info('🛡️ Setting up moderator system tables...');
    
    // Forum moderation log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS forum_moderation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moderator_id INTEGER,
        user_id INTEGER,
        post_id INTEGER,
        topic_id INTEGER,
        action TEXT NOT NULL,
        reason TEXT,
        resolved INTEGER DEFAULT 0,
        resolved_by INTEGER,
        resolved_at DATETIME,
        resolution_action TEXT,
        resolution_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (moderator_id) REFERENCES users(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES forum_posts(id),
        FOREIGN KEY (topic_id) REFERENCES forum_topics(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // Forum warnings table
    db.exec(`
      CREATE TABLE IF NOT EXISTS forum_warnings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        moderator_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (moderator_id) REFERENCES users(id)
      )
    `);

    // Forum bans table
    db.exec(`
      CREATE TABLE IF NOT EXISTS forum_bans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        moderator_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        expires_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (moderator_id) REFERENCES users(id)
      )
    `);

    // Social posts table (basic version for stats)
    db.exec(`
      CREATE TABLE IF NOT EXISTS social_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        deleted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Social reports table
    db.exec(`
      CREATE TABLE IF NOT EXISTS social_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        reason TEXT NOT NULL,
        resolved INTEGER DEFAULT 0,
        resolved_by INTEGER,
        resolved_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES social_posts(id),
        FOREIGN KEY (resolved_by) REFERENCES users(id)
      )
    `);

    // Create indexes for moderator tables (create them individually to handle errors gracefully)
    const moderatorIndexes = [
      'CREATE INDEX IF NOT EXISTS idx_moderation_log_action ON forum_moderation_log(action)',
      'CREATE INDEX IF NOT EXISTS idx_moderation_log_resolved ON forum_moderation_log(resolved)',
      'CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON forum_moderation_log(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_warnings_user ON forum_warnings(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_warnings_created ON forum_warnings(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_bans_user ON forum_bans(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_bans_expires ON forum_bans(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_social_posts_deleted ON social_posts(deleted)',
      'CREATE INDEX IF NOT EXISTS idx_social_reports_resolved ON social_reports(resolved)'
    ];

    moderatorIndexes.forEach(indexSql => {
      try {
        db.exec(indexSql);
      } catch (indexError) {
        // Log but don't fail - indexes are not critical for functionality
        logger.warn(`Index creation warning: ${indexError.message}`);
      }
    });

    logger.info('✅ Moderator system tables ready');
    logger.info('✅ All migrations completed successfully');
  } catch (error) {
    logger.error('❌ Migration error:', error);
    throw error;
  }
}

module.exports = { runMigrations };
