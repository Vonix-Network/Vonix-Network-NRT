// PM2 Ecosystem Configuration
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [{
    name: 'vonix-network',
    script: './server/index.js',
    
    // Instances
    instances: 1,  // Change to 'max' for cluster mode (uses all CPU cores)
    exec_mode: 'fork',  // Change to 'cluster' for multiple instances
    
    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    
    // Restart policy
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    
    // Graceful restart
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Watch (disable in production)
    watch: false,
    ignore_watch: [
      'node_modules',
      'logs',
      'data',
      'client',
      '.git'
    ],
    
    // Advanced features
    instance_var: 'INSTANCE_ID',
    
    // Source map support
    source_map_support: true,
    
    // Cron restart (optional)
    // cron_restart: '0 3 * * *',  // Restart daily at 3 AM
    
    // Time zone
    time: true
  }]
};
