const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');
const { JWT_SECRET } = require('../middleware/auth');
const { validateRegistrationApiKey } = require('../middleware/registration-auth');
const crypto = require('crypto');

const router = express.Router();

// Constants
const CODE_EXPIRY_MINUTES = 10;
const CODE_LENGTH = 6;
const MIN_PASSWORD_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

/**
 * Generate a secure random registration code
 * @returns {string} 6-character uppercase alphanumeric code
 */
function generateSecureCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Validate Minecraft UUID format
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID format
 */
function isValidMinecraftUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate Minecraft username
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
function isValidMinecraftUsername(username) {
  return username && 
         username.length >= 3 && 
         username.length <= 16 && 
         /^[a-zA-Z0-9_]+$/.test(username);
}

// Generate registration code (called by Minecraft mod)
// Protected by API key to prevent abuse
router.post('/generate-code', validateRegistrationApiKey, (req, res) => {
  const { minecraft_username, minecraft_uuid } = req.body;

  // Validate input
  if (!minecraft_username || !minecraft_uuid) {
    return res.status(400).json({ 
      error: 'Minecraft username and UUID required' 
    });
  }

  if (!isValidMinecraftUsername(minecraft_username)) {
    return res.status(400).json({ 
      error: 'Invalid Minecraft username format' 
    });
  }

  if (!isValidMinecraftUUID(minecraft_uuid)) {
    return res.status(400).json({ 
      error: 'Invalid Minecraft UUID format' 
    });
  }

  const db = getDatabase();

  try {
    // Check if user already registered
    const existingUser = db.prepare(
      'SELECT id, username FROM users WHERE minecraft_uuid = ?'
    ).get(minecraft_uuid);
    
    if (existingUser) {
      return res.status(400).json({ 
        error: 'This Minecraft account is already registered',
        username: existingUser.username
      });
    }

    // Generate a 6-character code
    const code = generateSecureCode();
    const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing unused codes for this UUID
    db.prepare(
      'DELETE FROM registration_codes WHERE minecraft_uuid = ? AND used = 0'
    ).run(minecraft_uuid);

    // Insert new code
    const stmt = db.prepare(`
      INSERT INTO registration_codes (code, minecraft_username, minecraft_uuid, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(code, minecraft_username, minecraft_uuid, expiresAt.toISOString());

    console.log(`✅ Generated registration code ${code} for ${minecraft_username} (${minecraft_uuid})`);

    res.json({
      code,
      expires_in: CODE_EXPIRY_MINUTES * 60, // seconds
      minecraft_username
    });
  } catch (error) {
    console.error('Error generating registration code:', error);
    res.status(500).json({ 
      error: 'Failed to generate registration code' 
    });
  } finally {
    
  }
});

// Register with code
router.post('/register', async (req, res) => {
  const { code, password } = req.body;

  // Validate input
  if (!code || !password) {
    return res.status(400).json({ 
      error: 'Code and password required' 
    });
  }

  if (code.length !== CODE_LENGTH) {
    return res.status(400).json({ 
      error: 'Invalid code format' 
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ 
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` 
    });
  }

  // Validate password strength
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ 
      error: 'Password must contain letters and numbers' 
    });
  }

  const db = getDatabase();
  const normalizedCode = code.toUpperCase();

  try {
    // Find registration code
    const regCode = db.prepare(`
      SELECT * FROM registration_codes 
      WHERE code = ? AND used = 0 AND expires_at > datetime('now')
    `).get(normalizedCode);

    if (!regCode) {
      return res.status(400).json({ 
        error: 'Invalid or expired registration code' 
      });
    }

    // Check if username or UUID already taken
    const existingUser = db.prepare(
      'SELECT id, username FROM users WHERE minecraft_username = ? OR minecraft_uuid = ?'
    ).get(regCode.minecraft_username, regCode.minecraft_uuid);

    if (existingUser) {
      return res.status(400).json({ 
        error: 'This Minecraft account is already registered',
        username: existingUser.username
      });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    
    // Create user
    const insertStmt = db.prepare(`
      INSERT INTO users (username, password, minecraft_username, minecraft_uuid, role)
      VALUES (?, ?, ?, ?, 'user')
    `);

    const result = insertStmt.run(
      regCode.minecraft_username,
      hashedPassword,
      regCode.minecraft_username,
      regCode.minecraft_uuid
    );

    const userId = result.lastInsertRowid;

    // Mark code as used
    db.prepare(`
      UPDATE registration_codes 
      SET used = 1, user_id = ?, used_at = datetime('now')
      WHERE id = ?
    `).run(userId, regCode.id);

    // Fetch new user
    const newUser = db.prepare(
      'SELECT id, username, minecraft_username, minecraft_uuid, role FROM users WHERE id = ?'
    ).get(userId);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        username: newUser.username,
        role: newUser.role,
        minecraft_uuid: newUser.minecraft_uuid
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ User registered successfully: ${newUser.username} (${newUser.minecraft_uuid})`);

    res.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        minecraft_username: newUser.minecraft_username,
        minecraft_uuid: newUser.minecraft_uuid,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  } finally {
    
  }
});

// Check if code is valid (for frontend validation)
router.get('/check-code/:code', (req, res) => {
  const { code } = req.params;

  // Validate code format
  if (!code || code.length !== CODE_LENGTH) {
    return res.status(400).json({ 
      valid: false,
      error: 'Invalid code format' 
    });
  }

  const db = getDatabase();
  const normalizedCode = code.toUpperCase();

  try {
    const regCode = db.prepare(`
      SELECT minecraft_username, minecraft_uuid, expires_at, created_at
      FROM registration_codes 
      WHERE code = ? AND used = 0 AND expires_at > datetime('now')
    `).get(normalizedCode);

    if (!regCode) {
      return res.json({ 
        valid: false,
        message: 'Code not found or expired'
      });
    }

    // Calculate time remaining
    const expiresAt = new Date(regCode.expires_at);
    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

    res.json({
      valid: true,
      minecraft_username: regCode.minecraft_username,
      minecraft_uuid: regCode.minecraft_uuid,
      expires_at: regCode.expires_at,
      time_remaining: timeRemaining
    });
  } catch (error) {
    console.error('Error checking code:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Failed to check code' 
    });
  } finally {
    
  }
});

// Get registration stats (admin only - could be protected with auth middleware)
router.get('/stats', (req, res) => {
  const db = getDatabase();

  try {
    const stats = {
      total_codes: db.prepare('SELECT COUNT(*) as count FROM registration_codes').get().count,
      used_codes: db.prepare('SELECT COUNT(*) as count FROM registration_codes WHERE used = 1').get().count,
      active_codes: db.prepare("SELECT COUNT(*) as count FROM registration_codes WHERE used = 0 AND expires_at > datetime('now')").get().count,
      registered_users: db.prepare('SELECT COUNT(*) as count FROM users WHERE minecraft_uuid IS NOT NULL').get().count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats' 
    });
  } finally {
    
  }
});

// Check if user is registered (for mod to determine flow)
// Protected by API key to prevent abuse
router.post('/check-registration', validateRegistrationApiKey, async (req, res) => {
  const { minecraft_uuid } = req.body;

  // Validate input
  if (!minecraft_uuid) {
    return res.status(400).json({ 
      error: 'Minecraft UUID required' 
    });
  }

  if (!isValidMinecraftUUID(minecraft_uuid)) {
    return res.status(400).json({ 
      error: 'Invalid Minecraft UUID format' 
    });
  }

  const db = getDatabase();

  try {
    // Check if user exists with this UUID
    const user = db.prepare(`
      SELECT id, username, minecraft_username, minecraft_uuid, role, 
             total_donated, donation_rank_id, donation_rank_expires_at
      FROM users 
      WHERE minecraft_uuid = ?
    `).get(minecraft_uuid);

    if (!user) {
      // User not registered
      return res.json({
        registered: false,
        message: 'User not registered'
      });
    }

    // User is registered
    res.json({
      registered: true,
      message: 'User is registered',
      user: {
        id: user.id,
        username: user.username,
        minecraft_username: user.minecraft_username,
        minecraft_uuid: user.minecraft_uuid,
        role: user.role,
        total_donated: user.total_donated || 0,
        donation_rank_id: user.donation_rank_id || null,
        donation_rank_expires_at: user.donation_rank_expires_at || null
      }
    });

    console.log(`✅ Registration check for ${minecraft_uuid}: User found (${user.minecraft_username})`);

  } catch (error) {
    console.error('Error checking registration:', error);
    res.status(500).json({ 
      error: 'Failed to check registration status' 
    });
  }
});

// Minecraft mod login endpoint
// Protected by API key to prevent abuse
router.post('/minecraft-login', validateRegistrationApiKey, async (req, res) => {
  const { minecraft_username, minecraft_uuid, password } = req.body;

  // Validate input
  if (!minecraft_username || !minecraft_uuid || !password) {
    return res.status(400).json({ 
      error: 'Minecraft username, UUID, and password required' 
    });
  }

  if (!isValidMinecraftUsername(minecraft_username)) {
    return res.status(400).json({ 
      error: 'Invalid Minecraft username format' 
    });
  }

  if (!isValidMinecraftUUID(minecraft_uuid)) {
    return res.status(400).json({ 
      error: 'Invalid Minecraft UUID format' 
    });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ 
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` 
    });
  }

  const db = getDatabase();

  try {
    // Find user by Minecraft UUID
    const user = db.prepare(`
      SELECT id, username, password, minecraft_username, minecraft_uuid, role, 
             total_donated, donation_rank_id, donation_rank_expires_at
      FROM users 
      WHERE minecraft_uuid = ?
    `).get(minecraft_uuid);

    if (!user) {
      console.log(`❌ Minecraft login failed: User not found for UUID ${minecraft_uuid}`);
      return res.status(401).json({ 
        error: 'Account not found. Please register first using /vonixregister' 
      });
    }

    // Verify the Minecraft username matches (in case of username changes)
    if (user.minecraft_username !== minecraft_username) {
      console.log(`⚠️  Minecraft username mismatch for ${minecraft_uuid}: ${user.minecraft_username} vs ${minecraft_username}`);
      
      // Update the username in the database
      db.prepare('UPDATE users SET minecraft_username = ? WHERE id = ?')
        .run(minecraft_username, user.id);
      
      console.log(`✅ Updated Minecraft username for user ${user.id}: ${minecraft_username}`);
    }

    // Verify password
    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      console.log(`❌ Minecraft login failed: Invalid password for ${minecraft_username} (${minecraft_uuid})`);
      return res.status(401).json({ 
        error: 'Invalid password' 
      });
    }

    // Generate JWT token for the session
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        minecraft_uuid: user.minecraft_uuid,
        minecraft_username: minecraft_username
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Minecraft login successful: ${minecraft_username} (${minecraft_uuid})`);

    // Return success with user info and token
    res.json({
      success: true,
      message: `Welcome back, ${minecraft_username}!`,
      token,
      user: {
        id: user.id,
        username: user.username,
        minecraft_username: minecraft_username,
        minecraft_uuid: user.minecraft_uuid,
        role: user.role,
        total_donated: user.total_donated || 0,
        donation_rank_id: user.donation_rank_id || null,
        donation_rank_expires_at: user.donation_rank_expires_at || null
      }
    });
  } catch (error) {
    console.error('Error during Minecraft login:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

module.exports = router;
