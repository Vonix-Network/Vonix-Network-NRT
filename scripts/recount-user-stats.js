#!/usr/bin/env node

/**
 * User Statistics Recount Script
 * 
 * This script recalculates and updates user statistics including:
 * - Post counts (forum posts)
 * - Topic counts (forum topics created)
 * - Likes received
 * - Best answers
 * - Reputation points
 * 
 * Usage:
 * node scripts/recount-user-stats.js [options]
 * 
 * Options:
 * --user-id <id>    Recount stats for specific user only
 * --dry-run         Show what would be updated without making changes
 * --verbose         Show detailed output
 */

const Database = require('better-sqlite3');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, '..', 'data', 'vonix.db');
const REPUTATION_POINTS = {
  TOPIC_CREATED: 5,
  POST_CREATED: 2,
  LIKE_RECEIVED: 3,
  BEST_ANSWER: 10
};

// Command line arguments
const args = process.argv.slice(2);
const options = {
  userId: null,
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose') || args.includes('-v')
};

// Parse user ID if provided
const userIdIndex = args.indexOf('--user-id');
if (userIdIndex !== -1 && args[userIdIndex + 1]) {
  options.userId = parseInt(args[userIdIndex + 1]);
}

/**
 * Database helper functions
 */
function runQuery(db, query, params = []) {
  // better-sqlite3 is synchronous
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

function runUpdate(db, query, params = []) {
  // better-sqlite3 is synchronous
  const stmt = db.prepare(query);
  const info = stmt.run(...params);
  return { changes: info.changes, lastID: info.lastInsertRowid };
}

function hasColumn(db, table, column) {
  try {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    return cols.some(c => c.name === column);
  } catch {
    return false;
  }
}

/**
 * Calculate user statistics
 */
async function calculateUserStats(db, userId) {
  try {
    // Get basic user info
    const userQuery = `
      SELECT id, username, minecraft_username 
      FROM users 
      WHERE id = ?
    `;
    const users = await runQuery(db, userQuery, [userId]);
    if (users.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    const user = users[0];

    // Count forum topics created (schema uses user_id)
    const topicsQuery = `
      SELECT COUNT(*) as count 
      FROM forum_topics 
      WHERE user_id = ?
    `;
    const topicsResult = await runQuery(db, topicsQuery, [userId]);
    const topicsCreated = topicsResult[0].count;

    // Count forum posts created (schema uses user_id) excluding deleted
    const postsQuery = `
      SELECT COUNT(*) as count 
      FROM forum_posts 
      WHERE user_id = ? AND deleted = 0
    `;
    const postsResult = await runQuery(db, postsQuery, [userId]);
    const postsCreated = postsResult[0].count;

    // Count likes (upvotes) received on posts via post_votes
    const likesQuery = `
      SELECT COUNT(*) as count 
      FROM post_votes pv
      JOIN forum_posts fp ON pv.post_id = fp.id
      WHERE fp.user_id = ? AND pv.vote_type = 'up'
    `;
    const likesResult = await runQuery(db, likesQuery, [userId]);
    const likesReceived = likesResult[0].count;

    // Count best answers if column exists; otherwise 0
    let bestAnswers = 0;
    if (hasColumn(db, 'forum_posts', 'is_best_answer')) {
      const bestAnswersQuery = `
        SELECT COUNT(*) as count 
        FROM forum_posts 
        WHERE user_id = ? AND is_best_answer = 1
      `;
      const bestAnswersResult = await runQuery(db, bestAnswersQuery, [userId]);
      bestAnswers = bestAnswersResult[0].count;
    }

    // Calculate reputation
    const reputation = 
      (topicsCreated * REPUTATION_POINTS.TOPIC_CREATED) +
      (postsCreated * REPUTATION_POINTS.POST_CREATED) +
      (likesReceived * REPUTATION_POINTS.LIKE_RECEIVED) +
      (bestAnswers * REPUTATION_POINTS.BEST_ANSWER);

    return {
      user,
      stats: {
        topicsCreated,
        postsCreated,
        likesReceived,
        bestAnswers,
        reputation
      }
    };
  } catch (error) {
    throw new Error(`Error calculating stats for user ${userId}: ${error.message}`);
  }
}

/**
 * Update user statistics in database
 */
async function updateUserStats(db, userId, stats) {
  try {
    // Update users table
    const updateUserQuery = `
      UPDATE users 
      SET 
        post_count = ?,
        reputation = ?,
        last_seen_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await runUpdate(db, updateUserQuery, [stats.postsCreated, stats.reputation, userId]);

    // Update or insert user_activity_stats
    const checkStatsQuery = `
      SELECT id FROM user_activity_stats WHERE user_id = ?
    `;
    const existingStats = await runQuery(db, checkStatsQuery, [userId]);

    if (existingStats.length > 0) {
      // Update existing stats
      const updateStatsQuery = `
        UPDATE user_activity_stats 
        SET 
          topics_created = ?,
          posts_created = ?,
          likes_received = ?,
          best_answers = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;
      await runUpdate(db, updateStatsQuery, [
        stats.topicsCreated,
        stats.postsCreated,
        stats.likesReceived,
        stats.bestAnswers,
        userId
      ]);
    } else {
      // Insert new stats
      const insertStatsQuery = `
        INSERT INTO user_activity_stats 
        (user_id, topics_created, posts_created, likes_received, best_answers, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `;
      await runUpdate(db, insertStatsQuery, [
        userId,
        stats.topicsCreated,
        stats.postsCreated,
        stats.likesReceived,
        stats.bestAnswers
      ]);
    }

    return true;
  } catch (error) {
    throw new Error(`Error updating stats for user ${userId}: ${error.message}`);
  }
}

/**
 * Get all users or specific user
 */
async function getUsers(db, userId = null) {
  const query = userId 
    ? `SELECT id, username, minecraft_username FROM users WHERE id = ?`
    : `SELECT id, username, minecraft_username FROM users ORDER BY id`;
  
  const params = userId ? [userId] : [];
  return await runQuery(db, query, params);
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔄 Starting user statistics recount...\n');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  const db = new Database(DB_PATH);
  
  try {
    // Get users to process
    const users = await getUsers(db, options.userId);
    
    if (users.length === 0) {
      console.log('❌ No users found to process');
      return;
    }

    console.log(`📊 Processing ${users.length} user(s)...\n`);

    let processed = 0;
    let errors = 0;

    for (const user of users) {
      try {
        if (options.verbose) {
          console.log(`Processing user: ${user.username} (ID: ${user.id})`);
        }

        // Calculate new stats
        const result = await calculateUserStats(db, user.id);
        const { stats } = result;

        // Show what would be updated
        if (options.verbose || options.dryRun) {
          console.log(`  📈 Stats for ${user.username}:`);
          console.log(`     Topics Created: ${stats.topicsCreated}`);
          console.log(`     Posts Created: ${stats.postsCreated}`);
          console.log(`     Likes Received: ${stats.likesReceived}`);
          console.log(`     Best Answers: ${stats.bestAnswers}`);
          console.log(`     Reputation: ${stats.reputation}`);
          console.log('');
        }

        // Update database if not dry run
        if (!options.dryRun) {
          await updateUserStats(db, user.id, stats);
        }

        processed++;
        
        if (!options.verbose && processed % 10 === 0) {
          console.log(`✅ Processed ${processed}/${users.length} users...`);
        }

      } catch (error) {
        console.error(`❌ Error processing user ${user.username} (ID: ${user.id}): ${error.message}`);
        errors++;
      }
    }

    console.log('\n📋 Summary:');
    console.log(`✅ Successfully processed: ${processed} users`);
    if (errors > 0) {
      console.log(`❌ Errors encountered: ${errors} users`);
    }
    
    if (options.dryRun) {
      console.log('\n🔍 This was a dry run - no changes were made');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('\n🎉 User statistics recount completed!');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
User Statistics Recount Script

Usage: node scripts/recount-user-stats.js [options]

Options:
  --user-id <id>    Recount stats for specific user only
  --dry-run         Show what would be updated without making changes
  --verbose, -v     Show detailed output for each user
  --help, -h        Show this help message

Examples:
  # Recount all users (dry run first)
  node scripts/recount-user-stats.js --dry-run --verbose
  
  # Recount all users (apply changes)
  node scripts/recount-user-stats.js
  
  # Recount specific user
  node scripts/recount-user-stats.js --user-id 1 --verbose
  
  # Recount specific user (dry run)
  node scripts/recount-user-stats.js --user-id 1 --dry-run

Reputation Points System:
  - Topic Created: ${REPUTATION_POINTS.TOPIC_CREATED} points
  - Post Created: ${REPUTATION_POINTS.POST_CREATED} points
  - Like Received: ${REPUTATION_POINTS.LIKE_RECEIVED} points
  - Best Answer: ${REPUTATION_POINTS.BEST_ANSWER} points
`);
}

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
