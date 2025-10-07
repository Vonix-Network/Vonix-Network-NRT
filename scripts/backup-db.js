const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_PATH || './data/vonix.db';
const backupDir = './backups';
const maxBackupAgeDays = 30; // Delete backups older than 30 days

/**
 * Create a backup of the database
 */
function createBackup() {
  try {
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      console.error(`❌ Database not found at: ${dbPath}`);
      process.exit(1);
    }
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${backupDir}`);
    }
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    const backupFilename = `vonix-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`✅ Backup created successfully`);
    console.log(`   File: ${backupPath}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    
    // Also backup WAL files if they exist
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, `${backupPath}-wal`);
      console.log(`   WAL: ${backupPath}-wal`);
    }
    
    if (fs.existsSync(shmPath)) {
      fs.copyFileSync(shmPath, `${backupPath}-shm`);
      console.log(`   SHM: ${backupPath}-shm`);
    }
    
    return backupPath;
  } catch (error) {
    console.error(`❌ Backup failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Clean up old backups
 */
function cleanOldBackups() {
  try {
    if (!fs.existsSync(backupDir)) {
      return;
    }
    
    const files = fs.readdirSync(backupDir);
    const cutoffDate = Date.now() - (maxBackupAgeDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      
      try {
        const stats = fs.statSync(filePath);
        
        if (stats.isFile() && stats.mtimeMs < cutoffDate) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not process file ${file}: ${error.message}`);
      }
    });
    
    if (deletedCount > 0) {
      console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
    } else {
      console.log(`ℹ️  No old backups to clean (keeping backups < ${maxBackupAgeDays} days)`);
    }
  } catch (error) {
    console.warn(`⚠️  Cleanup warning: ${error.message}`);
  }
}

/**
 * List all available backups
 */
function listBackups() {
  try {
    if (!fs.existsSync(backupDir)) {
      console.log('No backups found.');
      return;
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
          date: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (files.length === 0) {
      console.log('No backups found.');
      return;
    }
    
    console.log(`\nAvailable backups (${files.length}):\n`);
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${file.size}`);
      console.log(`   Date: ${file.date}\n`);
    });
  } catch (error) {
    console.error(`❌ Error listing backups: ${error.message}`);
  }
}

// Command line interface
const args = process.argv.slice(2);
const command = args[0] || 'backup';

switch (command) {
  case 'backup':
    console.log('🔄 Starting database backup...\n');
    createBackup();
    cleanOldBackups();
    console.log('\n✅ Backup process completed');
    break;
    
  case 'list':
    listBackups();
    break;
    
  case 'clean':
    console.log('🧹 Cleaning old backups...\n');
    cleanOldBackups();
    break;
    
  case 'help':
    console.log('\nDatabase Backup Utility\n');
    console.log('Usage: node scripts/backup-db.js [command]\n');
    console.log('Commands:');
    console.log('  backup    Create a new backup and clean old ones (default)');
    console.log('  list      List all available backups');
    console.log('  clean     Clean up old backups (>30 days)');
    console.log('  help      Show this help message\n');
    break;
    
  default:
    console.error(`Unknown command: ${command}`);
    console.log('Use "node scripts/backup-db.js help" for usage information');
    process.exit(1);
}
