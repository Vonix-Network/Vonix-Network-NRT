const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATABASE_PATH || './data/vonix.db';

// Singleton database instance for connection pooling
let dbInstance = null;

function initializeDatabase() {
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      minecraft_username TEXT UNIQUE,
      minecraft_uuid TEXT UNIQUE,
      must_change_password INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      ip_address TEXT NOT NULL,
      port INTEGER DEFAULT 25565,
      modpack_name TEXT,
      bluemap_url TEXT,
      curseforge_url TEXT,
      status TEXT DEFAULT 'offline',
      players_online INTEGER DEFAULT 0,
      players_max INTEGER DEFAULT 0,
      version TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      discord_message_id TEXT UNIQUE,
      server_id INTEGER,
      author_name TEXT NOT NULL,
      author_avatar TEXT,
      content TEXT,
      embeds TEXT,
      attachments TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      published INTEGER DEFAULT 0,
      featured_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS server_chat_config (
      server_id INTEGER PRIMARY KEY,
      chat_port INTEGER NOT NULL DEFAULT 25566,
      chat_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS registration_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      minecraft_username TEXT NOT NULL,
      minecraft_uuid TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      user_id INTEGER,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS donations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      minecraft_username TEXT,
      minecraft_uuid TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      method TEXT, -- e.g., paypal, crypto
      message TEXT,
      displayed INTEGER DEFAULT 1, -- whether to show on public list
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS private_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      recipient_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_private_messages_sender ON private_messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_private_messages_recipient ON private_messages(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_private_messages_created_at ON private_messages(created_at);

    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id INTEGER PRIMARY KEY,
      bio TEXT,
      location TEXT,
      website TEXT,
      banner_image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id)
    );

    CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(follower_id, following_id)
    );

    CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
    CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

    -- Stories
    CREATE TABLE IF NOT EXISTS stories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      background_color TEXT DEFAULT '#00d97e',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME DEFAULT (datetime('now', '+24 hours')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
    CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at);

    -- Story Views
    CREATE TABLE IF NOT EXISTS story_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      story_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(story_id, user_id)
    );

    -- Friend Requests
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(sender_id, receiver_id)
    );

    CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id);

    -- Friends (accepted friend requests)
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user1_id, user2_id)
    );

    CREATE INDEX IF NOT EXISTS idx_friends_user1 ON friends(user1_id);
    CREATE INDEX IF NOT EXISTS idx_friends_user2 ON friends(user2_id);
    CREATE INDEX IF NOT EXISTS idx_friends_composite ON friends(user1_id, user2_id);

    -- Post Reactions (extended likes)
    CREATE TABLE IF NOT EXISTS post_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      reaction_type TEXT NOT NULL DEFAULT 'like',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id)
    );

    CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON post_reactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_composite ON post_reactions(post_id, reaction_type);
    CREATE INDEX IF NOT EXISTS idx_post_reactions_user_post ON post_reactions(user_id, post_id);

    -- Comment Likes
    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      comment_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      UNIQUE(user_id, comment_id)
    );

    CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
    CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

    -- Post Shares
    CREATE TABLE IF NOT EXISTS post_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      original_post_id INTEGER NOT NULL,
      shared_post_id INTEGER NOT NULL,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (original_post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (shared_post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_post_shares_original ON post_shares(original_post_id);
    CREATE INDEX IF NOT EXISTS idx_post_shares_user ON post_shares(user_id);

    -- Social Groups
    CREATE TABLE IF NOT EXISTS social_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      privacy TEXT DEFAULT 'public',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Group Members
    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES social_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);

    -- Events
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      date DATETIME NOT NULL,
      location TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Event Attendees
    CREATE TABLE IF NOT EXISTS event_attendees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'attending',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(event_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
    CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
    CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);

    -- ========================================
    -- FORUM SYSTEM TABLES (phpBB-like)
    -- ========================================

    -- Forum Categories (top-level organization)
    CREATE TABLE IF NOT EXISTS forum_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Forums (sub-categories containing topics)
    CREATE TABLE IF NOT EXISTS forums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      order_index INTEGER DEFAULT 0,
      icon TEXT,
      locked INTEGER DEFAULT 0,
      topics_count INTEGER DEFAULT 0,
      posts_count INTEGER DEFAULT 0,
      last_post_id INTEGER,
      last_post_topic_id INTEGER,
      last_post_user_id INTEGER,
      last_post_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES forum_categories(id) ON DELETE CASCADE
    );

    -- Forum Topics (discussion threads)
    CREATE TABLE IF NOT EXISTS forum_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      forum_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      views INTEGER DEFAULT 0,
      replies INTEGER DEFAULT 0,
      locked INTEGER DEFAULT 0,
      pinned INTEGER DEFAULT 0,
      announcement INTEGER DEFAULT 0,
      poll_id INTEGER,
      last_post_id INTEGER,
      last_post_user_id INTEGER,
      last_post_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Forum Posts (replies within topics)
    CREATE TABLE IF NOT EXISTS forum_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      bbcode_content TEXT,
      edited_by INTEGER,
      edited_at DATETIME,
      deleted INTEGER DEFAULT 0,
      deleted_by INTEGER,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Forum Polls
    CREATE TABLE IF NOT EXISTS forum_polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      max_votes INTEGER DEFAULT 1,
      allow_revote INTEGER DEFAULT 0,
      ends_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
    );

    -- Forum Poll Options
    CREATE TABLE IF NOT EXISTS forum_poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      votes INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0,
      FOREIGN KEY (poll_id) REFERENCES forum_polls(id) ON DELETE CASCADE
    );

    -- Forum Poll Votes
    CREATE TABLE IF NOT EXISTS forum_poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (poll_id) REFERENCES forum_polls(id) ON DELETE CASCADE,
      FOREIGN KEY (option_id) REFERENCES forum_poll_options(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(poll_id, user_id, option_id)
    );

    -- User Groups (for permissions)
    CREATE TABLE IF NOT EXISTS user_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT,
      is_moderator INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      can_moderate INTEGER DEFAULT 0,
      can_edit_posts INTEGER DEFAULT 0,
      can_delete_posts INTEGER DEFAULT 0,
      can_lock_topics INTEGER DEFAULT 0,
      can_pin_topics INTEGER DEFAULT 0,
      can_move_topics INTEGER DEFAULT 0,
      can_ban_users INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User Group Memberships
    CREATE TABLE IF NOT EXISTS user_group_memberships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      is_primary INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      UNIQUE(user_id, group_id)
    );

    -- Forum Permissions (per-forum granular permissions)
    CREATE TABLE IF NOT EXISTS forum_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      forum_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      can_view INTEGER DEFAULT 1,
      can_post_topics INTEGER DEFAULT 1,
      can_post_replies INTEGER DEFAULT 1,
      can_edit_own INTEGER DEFAULT 1,
      can_delete_own INTEGER DEFAULT 0,
      FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES user_groups(id) ON DELETE CASCADE,
      UNIQUE(forum_id, group_id)
    );

    -- Forum Subscriptions (notifications)
    CREATE TABLE IF NOT EXISTS forum_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic_id INTEGER,
      forum_id INTEGER,
      notify_replies INTEGER DEFAULT 1,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (forum_id) REFERENCES forums(id) ON DELETE CASCADE
    );

    -- Forum Notifications
    CREATE TABLE IF NOT EXISTS forum_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- reply, mention, moderation, etc.
      topic_id INTEGER,
      post_id INTEGER,
      from_user_id INTEGER,
      content TEXT,
      read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Forum Moderator Actions Log
    CREATE TABLE IF NOT EXISTS forum_moderation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moderator_id INTEGER NOT NULL,
      action TEXT NOT NULL, -- lock, unlock, pin, move, delete, etc.
      target_type TEXT NOT NULL, -- topic, post, user
      target_id INTEGER NOT NULL,
      reason TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User Warnings/Infractions
    CREATE TABLE IF NOT EXISTS forum_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      moderator_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      points INTEGER DEFAULT 1,
      expires_at DATETIME,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (moderator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- User Bans
    CREATE TABLE IF NOT EXISTS forum_bans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      banned_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      ban_type TEXT DEFAULT 'temporary', -- temporary, permanent
      expires_at DATETIME,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Forum Attachments
    CREATE TABLE IF NOT EXISTS forum_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      mime_type TEXT,
      file_size INTEGER,
      download_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Forum Bookmarks (save topics)
    CREATE TABLE IF NOT EXISTS forum_bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      UNIQUE(user_id, topic_id)
    );

    -- Forum Topic Views (track last read position)
    CREATE TABLE IF NOT EXISTS forum_topic_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      last_post_id INTEGER,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      UNIQUE(user_id, topic_id)
    );

    -- Forum Search Index (for better search performance)
    CREATE TABLE IF NOT EXISTS forum_search_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      topic_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
      FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_forums_category ON forums(category_id);
    CREATE INDEX IF NOT EXISTS idx_forum_topics_forum ON forum_topics(forum_id);
    CREATE INDEX IF NOT EXISTS idx_forum_topics_user ON forum_topics(user_id);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic_id);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_user ON forum_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at);
    CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_user ON forum_subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_forum_subscriptions_topic ON forum_subscriptions(topic_id);
    CREATE INDEX IF NOT EXISTS idx_forum_notifications_user ON forum_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_forum_search_content ON forum_search_index(content_text);
    
    -- Additional performance indexes
    CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned_time ON forum_topics(forum_id, pinned DESC, last_post_time DESC);
    CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_created ON forum_posts(topic_id, created_at ASC);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_minecraft_uuid ON users(minecraft_uuid);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published, created_at DESC);
  `);

  // Migrations: Add columns if they don't exist
  try {
    const chatTableInfo = db.prepare("PRAGMA table_info(chat_messages)").all();
    const hasEmbedsColumn = chatTableInfo.some(col => col.name === 'embeds');
    const hasAttachmentsColumn = chatTableInfo.some(col => col.name === 'attachments');
    const hasServerIdColumn = chatTableInfo.some(col => col.name === 'server_id');
    
    if (!hasEmbedsColumn) {
      console.log('🔄 Migrating database: Adding embeds column to chat_messages...');
      db.exec('ALTER TABLE chat_messages ADD COLUMN embeds TEXT');
      console.log('✅ Migration complete: embeds column added');
    }
    
    if (!hasAttachmentsColumn) {
      console.log('🔄 Migrating database: Adding attachments column to chat_messages...');
      db.exec('ALTER TABLE chat_messages ADD COLUMN attachments TEXT');
      console.log('✅ Migration complete: attachments column added');
    }
    
    if (!hasServerIdColumn) {
      console.log('🔄 Migrating database: Adding server_id column to chat_messages...');
      db.exec('ALTER TABLE chat_messages ADD COLUMN server_id INTEGER');
      console.log('✅ Migration complete: server_id column added');
    }

    // Migrate users table for Minecraft support
    const usersTableInfo = db.prepare("PRAGMA table_info(users)").all();
    const hasMinecraftUsername = usersTableInfo.some(col => col.name === 'minecraft_username');
    const hasMinecraftUuid = usersTableInfo.some(col => col.name === 'minecraft_uuid');
    
    if (!hasMinecraftUsername) {
      console.log('🔄 Migrating database: Adding minecraft_username column to users...');
      db.exec('ALTER TABLE users ADD COLUMN minecraft_username TEXT');
      console.log('✅ Migration complete: minecraft_username column added');
    }
    
    if (!hasMinecraftUuid) {
      console.log('🔄 Migrating database: Adding minecraft_uuid column to users...');
      db.exec('ALTER TABLE users ADD COLUMN minecraft_uuid TEXT');
      console.log('✅ Migration complete: minecraft_uuid column added');
    }
  } catch (error) {
    console.error('⚠️  Migration warning:', error.message);
  }

  // First-time setup: if there are no users, mark setup as required instead of creating a default admin
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount === 0) {
      // Write a settings flag indicating setup is required
      const upsert = db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('setup_required', '1', CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);
      upsert.run();
      console.log('✅ Setup required flag set (no users found)');
    } else {
      // Ensure setup flag is cleared if users exist
      const upsert = db.prepare(`
        INSERT INTO settings (key, value, updated_at) VALUES ('setup_required', '0', CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `);
      upsert.run();
    }
  } catch (e) {
    console.warn('⚠️  Could not set setup_required flag:', e.message);
  }

  // Create sample server if no servers exist
  const serverCount = db.prepare('SELECT COUNT(*) as count FROM servers').get().count;
  if (serverCount === 0) {
    const stmt = db.prepare(`
      INSERT INTO servers (name, description, ip_address, port, modpack_name, order_index) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      'BMC5 Server',
      'Official BMC5 by LunaPixel Studios modded server. Join our community and explore!',
      'play.vonix.network',
      25565,
      'BMC5 by LunaPixel Studios',
      1
    );
    console.log('✅ Sample server created');
  }

  // Create default user groups if they don't exist
  const groupCount = db.prepare('SELECT COUNT(*) as count FROM user_groups').get().count;
  if (groupCount === 0) {
    const groupStmt = db.prepare(`
      INSERT INTO user_groups (name, description, color, is_admin, is_moderator, can_moderate, can_edit_posts, can_delete_posts, can_lock_topics, can_pin_topics, can_move_topics, can_ban_users)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    groupStmt.run('Administrators', 'Site administrators with full control', '#ff0000', 1, 1, 1, 1, 1, 1, 1, 1, 1);
    groupStmt.run('Moderators', 'Forum moderators', '#00aa00', 0, 1, 1, 1, 1, 1, 1, 1, 0);
    groupStmt.run('Registered Users', 'Regular registered members', '#0066cc', 0, 0, 0, 0, 0, 0, 0, 0, 0);
    groupStmt.run('Guests', 'Unregistered visitors', '#999999', 0, 0, 0, 0, 0, 0, 0, 0, 0);
    
    console.log('✅ Default user groups created');
  }

  // Create sample forum categories and forums
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM forum_categories').get().count;
  if (categoryCount === 0) {
    // Create categories
    const catStmt = db.prepare('INSERT INTO forum_categories (name, description, order_index) VALUES (?, ?, ?)');
    catStmt.run('General Discussion', 'General topics and community discussions', 1);
    catStmt.run('Minecraft Servers', 'Discussions about our Minecraft servers', 2);
    catStmt.run('Support', 'Get help and support', 3);
    
    // Create forums
    const forumStmt = db.prepare(`
      INSERT INTO forums (category_id, name, description, order_index)
      VALUES (?, ?, ?, ?)
    `);
    
    forumStmt.run(1, 'Announcements', 'Official announcements and news', 1);
    forumStmt.run(1, 'General Chat', 'Talk about anything and everything', 2);
    forumStmt.run(1, 'Introductions', 'Introduce yourself to the community', 3);
    forumStmt.run(2, 'Server Discussion', 'Discuss gameplay, builds, and adventures', 1);
    forumStmt.run(2, 'Suggestions', 'Suggest new features and improvements', 2);
    forumStmt.run(3, 'Technical Support', 'Get help with technical issues', 1);
    forumStmt.run(3, 'Ban Appeals', 'Appeal your ban here', 2);
    
    console.log('✅ Sample forum structure created');
  }

  // Run migrations for new features
  const { runMigrations } = require('./migrations');
  runMigrations(db);

  db.close();
  console.log('✅ Database initialized successfully');
}

function getDatabase() {
  // Return singleton instance for connection pooling
  // If the instance was previously closed, recreate it safely
  if (!dbInstance || (dbInstance && dbInstance.open === false)) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('synchronous = NORMAL');
    dbInstance.pragma('cache_size = -64000'); // 64MB cache
    dbInstance.pragma('temp_store = MEMORY');
    
    // Log connection
    console.log('✅ Database connection established (singleton)');
  }
  return dbInstance;
}

function closeDatabase() {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    console.log('✅ Database connection closed');
  }
}

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase
};
