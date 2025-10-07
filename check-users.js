#!/usr/bin/env node

// Quick script to check users in the database
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'server', 'database', 'vonix.db');

// Check if database exists
if (!fs.existsSync(dbPath)) {
  console.log('❌ Database not found at:', dbPath);
  console.log('');
  console.log('Run the server first to create the database:');
  console.log('  npm run dev');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('Checking database:', dbPath);
console.log('');

try {
  const users = db.prepare('SELECT id, username, minecraft_username, minecraft_uuid, role, created_at FROM users').all();
  
  if (users.length === 0) {
    console.log('❌ No users found in database!');
    console.log('');
    console.log('This is why you\'re getting "User not found" errors.');
    console.log('');
    console.log('Solutions:');
    console.log('  1. Create a new account by registering');
    console.log('  2. Run /vonixregister in Minecraft to generate a code');
    console.log('  3. Use the code at https://vonix.network/register');
  } else {
    console.log(`✅ Found ${users.length} user(s):`);
    console.log('');
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Minecraft: ${user.minecraft_username || 'N/A'}`);
      console.log(`  UUID: ${user.minecraft_uuid || 'N/A'}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Created: ${user.created_at}`);
      console.log('');
    });
  }
} catch (error) {
  console.error('Error reading database:', error.message);
  console.log('');
  console.log('Make sure the database has been initialized.');
  console.log('Run: npm run dev (from the main directory)');
}

db.close();
