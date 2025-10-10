const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database optimization script
async function optimizeDatabase() {
  const dbPath = path.join(__dirname, '..', 'database', 'vonix.db');

  if (!fs.existsSync(dbPath)) {
    console.log('Database file not found, skipping optimization');
    return;
  }

  const db = new Database(dbPath);

  console.log('🚀 Starting database optimization...');

  try {
    // Optimize cache size - conservative for low-end servers
    db.pragma('cache_size = -16000'); // 16MB cache (conservative for t3.small)

    // Enable foreign key constraints
    db.pragma('foreign_keys = ON');

    // Synchronous mode for data safety on low-end servers
    db.pragma('synchronous = FULL');

    // Conservative mmap size for low-memory servers
    db.pragma('mmap_size = 134217728'); // 128MB (conservative)

    // Temp store in memory for better performance
    db.pragma('temp_store = MEMORY');

    // Journal mode - WAL is good but can be memory intensive
    db.pragma('journal_mode = WAL');

    // Create indexes for better query performance
    console.log('📊 Creating performance indexes...');

    // User table indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
    `);

    // Forum posts indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_forum_posts_author_id ON forum_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_topic_id ON forum_posts(topic_id);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts(created_at);
      CREATE INDEX IF NOT EXISTS idx_forum_posts_updated_at ON forum_posts(updated_at);
      CREATE INDEX IF NOT EXISTS idx_forum_topics_forum_id ON forum_topics(forum_id);
      CREATE INDEX IF NOT EXISTS idx_forum_topics_created_at ON forum_topics(created_at);
    `);

    // Reputation indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_reputation_user_id ON reputation(user_id);
      CREATE INDEX IF NOT EXISTS idx_reputation_type ON reputation(type);
      CREATE INDEX IF NOT EXISTS idx_reputation_created_at ON reputation(created_at);
    `);

    // Messages indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read_status);
    `);

    // Donations indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id);
      CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
      CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
    `);

    // Social features indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_social_posts_author_id ON social_posts(author_id);
      CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON social_posts(created_at);
      CREATE INDEX IF NOT EXISTS idx_social_comments_post_id ON social_comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_social_likes_post_id ON social_likes(post_id);
    `);

    // Run VACUUM to reclaim space and optimize
    console.log('🧹 Running VACUUM to optimize database file...');
    db.exec('VACUUM');

    // Run ANALYZE to update query planner statistics
    console.log('📈 Running ANALYZE to update query statistics...');
    db.exec('ANALYZE');

    // Get database statistics
    const stats = {
      pageCount: db.pragma('page_count', { simple: true }),
      pageSize: db.pragma('page_size', { simple: true }),
      cacheSize: db.pragma('cache_size', { simple: true }),
      synchronous: db.pragma('synchronous', { simple: true }),
      journalMode: db.pragma('journal_mode', { simple: true })
    };

    console.log('📊 Database Statistics:');
    console.log(`- Page Count: ${stats.pageCount}`);
    console.log(`- Page Size: ${stats.pageSize} bytes`);
    console.log(`- Total Size: ${(stats.pageCount * stats.pageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Cache Size: ${stats.cacheSize} pages`);
    console.log(`- Journal Mode: ${stats.journalMode}`);
    console.log(`- Synchronous Mode: ${stats.synchronous}`);

    console.log('✅ Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Database optimization failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Query optimization helper
function optimizeQuery(query, params = []) {
  // Add query hints for better performance
  const optimizedQuery = query
    .replace(/SELECT\s+/i, 'SELECT /*+ INDEXED */ ')
    .replace(/ORDER BY\s+([^LIMIT]+)(LIMIT\s+\d+)?/i, 'ORDER BY $1 $2');

  return optimizedQuery;
}

// Connection pool optimization for high-traffic scenarios
class DatabasePool {
  constructor(dbPath, poolSize = 5) {
    this.dbPath = dbPath;
    this.poolSize = poolSize;
    this.pool = [];
    this.available = [];
    this.waiting = [];
  }

  async getConnection() {
    return new Promise((resolve, reject) => {
      if (this.available.length > 0) {
        const db = this.available.pop();
        resolve(db);
      } else if (this.pool.length < this.poolSize) {
        const db = new Database(this.dbPath);
        this.pool.push(db);
        resolve(db);
      } else {
        this.waiting.push({ resolve, reject });
      }
    });
  }

  releaseConnection(db) {
    if (this.waiting.length > 0) {
      const { resolve } = this.waiting.shift();
      resolve(db);
    } else {
      this.available.push(db);
    }
  }

  async optimizePool() {
    for (const db of this.pool) {
      db.pragma('cache_size = -32000'); // 32MB per connection
      db.pragma('temp_store = MEMORY');
    }
  }

  close() {
    for (const db of this.pool) {
      db.close();
    }
    this.pool = [];
    this.available = [];
    this.waiting = [];
  }
}

module.exports = {
  optimizeDatabase,
  optimizeQuery,
  DatabasePool
};

// Run optimization if called directly
if (require.main === module) {
  optimizeDatabase()
    .then(() => {
      console.log('🎉 Database optimization completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database optimization failed:', error);
      process.exit(1);
    });
}
