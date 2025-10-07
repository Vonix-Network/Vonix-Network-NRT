#!/usr/bin/env node

// Create a test user for development
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'server', 'database', 'vonix.db');

if (!fs.existsSync(dbPath)) {
  console.log('❌ Database not found. Run the server first: npm run dev');
  process.exit(1);
}

const db = new Database(dbPath);

const username = process.argv[2] || 'testuser';
const password = process.argv[3] || 'password123';
const role = process.argv[4] || 'admin';

try {
  // Check if user already exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    console.log(`❌ User "${username}" already exists!`);
    console.log('');
    console.log('To delete and recreate:');
    console.log(`  node delete-user.js ${username}`);
    process.exit(1);
  }

  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Insert user
  const stmt = db.prepare(`
    INSERT INTO users (username, password, role)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(username, hashedPassword, role);
  
  console.log('✅ Test user created successfully!');
  console.log('');
  console.log(`Username: ${username}`);
  console.log(`Password: ${password}`);
  console.log(`Role: ${role}`);
  console.log(`User ID: ${result.lastInsertRowid}`);
  console.log('');
  console.log('Now you can login at: https://vonix.network/login');
  
} catch (error) {
  console.error('❌ Error creating user:', error.message);
} finally {
  db.close();
}
