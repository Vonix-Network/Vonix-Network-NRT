#!/usr/bin/env node

// Create test forum data for development
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'vonix.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database not found. Run the server first: npm run dev');
  process.exit(1);
}

const db = new Database(dbPath);

try {
  console.log('🔄 Creating test forum data...');

  // Get or create test users
  let testUsers = [];
  
  // Check if we have users
  const existingUsers = db.prepare('SELECT id, username FROM users LIMIT 5').all();
  
  if (existingUsers.length === 0) {
    console.log('❌ No users found. Create some users first with create-test-user.js');
    process.exit(1);
  }
  
  testUsers = existingUsers;
  console.log(`✅ Found ${testUsers.length} users to use for test data`);

  // Get forum IDs
  const forums = db.prepare('SELECT id, name FROM forums').all();
  if (forums.length === 0) {
    console.log('❌ No forums found. Database may not be properly initialized.');
    process.exit(1);
  }

  console.log(`✅ Found ${forums.length} forums`);

  // Create some test topics
  const topics = [
    { title: 'Welcome to the Community!', content: 'This is a welcome post for new members. Feel free to introduce yourself!' },
    { title: 'Server Rules and Guidelines', content: 'Please read and follow these important server rules to ensure everyone has a great experience.' },
    { title: 'Tips for New Players', content: 'Here are some helpful tips for players just starting out on our server.' },
    { title: 'Community Events Calendar', content: 'Check out our upcoming community events and activities!' },
    { title: 'Bug Reports and Issues', content: 'Report any bugs or issues you encounter here.' }
  ];

  const replies = [
    'Thanks for the information!',
    'This is really helpful.',
    'Great post, very informative.',
    'I agree with this completely.',
    'Thanks for sharing!',
    'This helped me a lot.',
    'Excellent explanation.',
    'Very well written.',
    'I learned something new today.',
    'Keep up the good work!'
  ];

  // Create topics and posts
  for (let i = 0; i < topics.length; i++) {
    const topic = topics[i];
    const forumId = forums[Math.floor(Math.random() * forums.length)].id;
    const authorId = testUsers[Math.floor(Math.random() * testUsers.length)].id;
    
    // Generate slug
    const slug = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now() + '-' + i;
    
    // Create topic
    const topicResult = db.prepare(`
      INSERT INTO forum_topics (forum_id, user_id, title, slug, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
    `).run(forumId, authorId, topic.title, slug, Math.floor(Math.random() * 30));
    
    const topicId = topicResult.lastInsertRowid;
    
    // Create initial post
    const postResult = db.prepare(`
      INSERT INTO forum_posts (topic_id, user_id, content, bbcode_content, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
    `).run(topicId, authorId, topic.content, topic.content, Math.floor(Math.random() * 30));
    
    const firstPostId = postResult.lastInsertRowid;
    
    // Update topic with first post info
    db.prepare(`
      UPDATE forum_topics 
      SET last_post_id = ?, last_post_user_id = ?, last_post_time = datetime('now', '-' || ? || ' days')
      WHERE id = ?
    `).run(firstPostId, authorId, Math.floor(Math.random() * 30), topicId);
    
    // Create some replies
    const numReplies = Math.floor(Math.random() * 8) + 2; // 2-9 replies
    for (let j = 0; j < numReplies; j++) {
      const replyAuthorId = testUsers[Math.floor(Math.random() * testUsers.length)].id;
      const replyContent = replies[Math.floor(Math.random() * replies.length)];
      
      const replyResult = db.prepare(`
        INSERT INTO forum_posts (topic_id, user_id, content, bbcode_content, created_at)
        VALUES (?, ?, ?, ?, datetime('now', '-' || ? || ' days'))
      `).run(topicId, replyAuthorId, replyContent, replyContent, Math.floor(Math.random() * 25));
      
      const replyId = replyResult.lastInsertRowid;
      
      // Update topic reply count and last post
      db.prepare(`
        UPDATE forum_topics 
        SET replies = replies + 1, last_post_id = ?, last_post_user_id = ?, last_post_time = datetime('now', '-' || ? || ' days')
        WHERE id = ?
      `).run(replyId, replyAuthorId, Math.floor(Math.random() * 25), topicId);
      
      // Add some random votes to posts
      if (Math.random() > 0.3) { // 70% chance of getting votes
        const numVotes = Math.floor(Math.random() * 5) + 1; // 1-5 votes
        for (let k = 0; k < numVotes; k++) {
          const voterId = testUsers[Math.floor(Math.random() * testUsers.length)].id;
          const voteType = Math.random() > 0.2 ? 'up' : 'down'; // 80% upvotes, 20% downvotes
          
          // Avoid duplicate votes
          try {
            db.prepare(`
              INSERT INTO post_votes (post_id, user_id, vote_type, created_at)
              VALUES (?, ?, ?, datetime('now', '-' || ? || ' days'))
            `).run(replyId, voterId, voteType, Math.floor(Math.random() * 20));
          } catch (e) {
            // Ignore duplicate vote errors
          }
        }
      }
    }
    
    // Update forum stats
    db.prepare(`
      UPDATE forums 
      SET topics_count = topics_count + 1,
          posts_count = posts_count + ?,
          last_post_id = (SELECT id FROM forum_posts WHERE topic_id = ? ORDER BY created_at DESC LIMIT 1),
          last_post_topic_id = ?,
          last_post_user_id = (SELECT user_id FROM forum_posts WHERE topic_id = ? ORDER BY created_at DESC LIMIT 1),
          last_post_time = (SELECT created_at FROM forum_posts WHERE topic_id = ? ORDER BY created_at DESC LIMIT 1)
      WHERE id = ?
    `).run(numReplies + 1, topicId, topicId, topicId, topicId, forumId);
    
    console.log(`✅ Created topic "${topic.title}" with ${numReplies} replies`);
  }

  // Update user post counts and activity stats
  console.log('🔄 Updating user activity stats...');
  
  for (const user of testUsers) {
    // Count actual posts
    const postCount = db.prepare('SELECT COUNT(*) as count FROM forum_posts WHERE user_id = ? AND deleted = 0').get(user.id).count;
    const topicCount = db.prepare('SELECT COUNT(*) as count FROM forum_topics WHERE user_id = ?').get(user.id).count;
    const likesReceived = db.prepare(`
      SELECT COUNT(*) as count FROM post_votes pv 
      JOIN forum_posts fp ON pv.post_id = fp.id 
      WHERE fp.user_id = ? AND pv.vote_type = 'up'
    `).get(user.id).count;
    const likesGiven = db.prepare('SELECT COUNT(*) as count FROM post_votes WHERE user_id = ? AND vote_type = \'up\'').get(user.id).count;
    
    // Update user post_count
    db.prepare('UPDATE users SET post_count = ? WHERE id = ?').run(postCount, user.id);
    
    // Update or create activity stats
    db.prepare(`
      INSERT OR REPLACE INTO user_activity_stats 
      (user_id, topics_created, posts_created, likes_received, likes_given, best_answers, days_active, last_post_at, join_date)
      VALUES (?, ?, ?, ?, ?, 0, ?, datetime('now'), datetime('now'))
    `).run(user.id, topicCount, postCount, likesReceived, likesGiven, Math.floor(Math.random() * 30) + 1);
    
    console.log(`✅ Updated stats for ${user.username}: ${topicCount} topics, ${postCount} posts, ${likesReceived} likes received`);
  }

  console.log('');
  console.log('✅ Test forum data created successfully!');
  console.log('');
  console.log('You can now test the forum engagement counter on the reputation leaderboard.');
  console.log('Visit: http://localhost:3000/leaderboard');

} catch (error) {
  console.error('❌ Error creating test data:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}
