# Deployment Guide

Complete guide for deploying Vonix Network to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Options](#deployment-options)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [VPS Deployment](#vps-deployment)
- [Cloud Platforms](#cloud-platforms)
- [Configuration](#configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum**:
- 1 CPU core
- 1 GB RAM
- 10 GB storage
- Ubuntu 20.04+ or similar Linux distribution

**Recommended**:
- 2+ CPU cores
- 2 GB+ RAM
- 20 GB+ SSD storage
- Ubuntu 22.04 LTS

### Software Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git**
- **Docker & Docker Compose** (for Docker deployment)
- **Nginx** (for reverse proxy, recommended)

### Network Requirements

- **Ports**:
  - `80` (HTTP)
  - `443` (HTTPS)
  - `5000` (Application - can be internal only with reverse proxy)
- **Domain name** (recommended)
- **SSL certificate** (Let's Encrypt recommended)

---

## Deployment Options

### 1. Docker Deployment ⭐ Recommended

**Pros**:
- Easy setup and deployment
- Consistent environment
- Easy updates and rollbacks
- Built-in health checks
- Production-ready configuration

**Best for**: Most production deployments

### 2. Manual Deployment

**Pros**:
- Full control over environment
- Better understanding of system
- Lower resource overhead

**Best for**: VPS or dedicated servers

### 3. Cloud Platform Deployment

**Pros**:
- Managed infrastructure
- Easy scaling
- Built-in monitoring

**Platforms**: AWS, Google Cloud, Azure, DigitalOcean, Heroku

---

## Docker Deployment

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Build and start
docker-compose up -d

# 4. View logs
docker-compose logs -f

# 5. Check status
docker-compose ps
```

### Environment Configuration

Edit `.env` file:

```env
# Server
NODE_ENV=production
PORT=5000

# Security (REQUIRED - Generate secure values!)
JWT_SECRET=your-super-secret-jwt-key-here

# Frontend
CLIENT_URL=https://vonix.network

# Database
DATABASE_PATH=./data/vonix.db

# Discord (Optional)
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CHANNEL_ID=your_channel_id
DISCORD_WEBHOOK_URL=your_webhook_url

# Logging
LOG_LEVEL=info

# Error Tracking (Optional)
# SENTRY_DSN=your_sentry_dsn

# Cache
CACHE_TTL=300
```

### Generate Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f vonix-backend

# Check status
docker-compose ps

# Execute command in container
docker-compose exec vonix-backend sh

# Rebuild after code changes
docker-compose up -d --build

# Update to latest version
git pull
docker-compose up -d --build

# Backup database
docker-compose exec vonix-backend node scripts/backup-db.js
```

### Persistent Data

Data is persisted in volumes:
- `./data` - SQLite database
- `./logs` - Application logs
- `./backups` - Database backups

**Important**: Backup these directories regularly!

---

## Manual Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 16.x
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be >= 16.0.0
npm --version   # Should be >= 8.0.0

# Install Git
sudo apt install -y git

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx
```

### 2. Clone and Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash vonix
sudo su - vonix

# Clone repository
git clone https://github.com/yourusername/vonix-network.git
cd vonix-network

# Install dependencies
npm run install-all

# Build frontend
npm run build

# Configure environment
cp .env.example .env
nano .env
# Edit with production values
```

### 3. Start Application with PM2

```bash
# Start application
pm2 start server/index.js --name vonix-network

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions displayed

# View logs
pm2 logs vonix-network

# Monitor
pm2 monit

# Restart
pm2 restart vonix-network

# Stop
pm2 stop vonix-network

# Status
pm2 status
```

### 4. PM2 Configuration (Optional)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'vonix-network',
    script: 'server/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    watch: false,
    autorestart: true
  }]
};
```

Start with config:
```bash
pm2 start ecosystem.config.js
```

---

## VPS Deployment

### DigitalOcean Droplet

1. **Create Droplet**
   - Choose Ubuntu 22.04 LTS
   - Minimum: 1GB RAM, 1 vCPU
   - Recommended: 2GB RAM, 2 vCPU
   - Add SSH key

2. **Connect**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Follow Manual Deployment** steps above

### AWS EC2

1. **Launch Instance**
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.small or better
   - Configure Security Group:
     - SSH (22)
     - HTTP (80)
     - HTTPS (443)
     - Custom TCP (5000) - if needed

2. **Connect**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Follow Manual Deployment** steps above

### Google Cloud Platform

1. **Create VM Instance**
   - OS: Ubuntu 22.04 LTS
   - Machine type: e2-small or better
   - Firewall: Allow HTTP and HTTPS traffic

2. **Connect via SSH** from console

3. **Follow Manual Deployment** steps above

---

## SSL/HTTPS Setup

### Using Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d vonix.network -d www.vonix.network

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (recommended)

# Test auto-renewal
sudo certbot renew --dry-run

# Certificate auto-renews every 90 days
```

### Manual SSL Certificate

If you have an SSL certificate from another provider:

```bash
# Copy certificate files to server
sudo mkdir -p /etc/nginx/ssl
sudo cp your-certificate.crt /etc/nginx/ssl/
sudo cp your-private-key.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

---

## Nginx Reverse Proxy

### Configuration

Create `/etc/nginx/sites-available/vonix-network`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

# Upstream backend
upstream vonix_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name vonix.network www.vonix.network;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name vonix.network www.vonix.network;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/vonix.network/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vonix.network/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/vonix-access.log;
    error_log /var/log/nginx/vonix-error.log;

    # Max body size
    client_max_body_size 10M;

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://vonix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://vonix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Static files (if serving frontend from Nginx)
    location / {
        limit_req zone=general burst=50 nodelay;
        
        proxy_pass http://vonix_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check (no rate limit)
    location /api/health {
        proxy_pass http://vonix_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/vonix-network /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Configuration

### Environment Variables

**Production checklist**:

```env
# ✅ Set to production
NODE_ENV=production

# ✅ Use strong random value
JWT_SECRET=<64-character-random-string>

# ✅ Set to your domain
CLIENT_URL=https://vonix.network

# ✅ Secure database path
DATABASE_PATH=./data/vonix.db

# ✅ Set appropriate log level
LOG_LEVEL=info  # or warn/error for production

# Optional but recommended for monitoring
SENTRY_DSN=your_sentry_dsn_here
```

### Database

**Location**: `./data/vonix.db`

**Backup**: 
```bash
# Manual backup
npm run backup

# Or copy directly
cp ./data/vonix.db ./backups/vonix-backup-$(date +%Y%m%d).db

# Automated backup (cron)
echo "0 2 * * * cd /path/to/vonix-network && npm run backup" | crontab -
```

### File Permissions

```bash
# Application files
sudo chown -R vonix:vonix /home/vonix/vonix-network

# Data directory (writable)
chmod 755 data/
chmod 644 data/vonix.db

# Logs directory (writable)
chmod 755 logs/

# Environment file (sensitive)
chmod 600 .env
```

---

## Monitoring & Maintenance

### Health Checks

```bash
# Check application health
curl http://localhost:5000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","checks":{...}}
```

### Uptime Monitoring

Use services like:
- **UptimeRobot** (free)
- **Pingdom**
- **StatusCake**
- **AWS CloudWatch**

Monitor: `https://vonix.network/api/health`

### Log Monitoring

```bash
# Application logs
tail -f logs/combined-*.log
tail -f logs/error-*.log

# PM2 logs
pm2 logs vonix-network

# Nginx logs
sudo tail -f /var/log/nginx/vonix-access.log
sudo tail -f /var/log/nginx/vonix-error.log

# System logs
sudo journalctl -u nginx -f
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
# or
top

# Disk usage
df -h

# Memory usage
free -h

# Network connections
ss -tuln | grep :5000
```

### Automated Backups

Create backup script `/home/vonix/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/vonix/vonix-network/backups"
DATE=$(date +%Y%m%d-%H%M%S)
DB_FILE="/home/vonix/vonix-network/data/vonix.db"

# Create backup
cp $DB_FILE $BACKUP_DIR/vonix-backup-$DATE.db

# Keep only last 30 days
find $BACKUP_DIR -name "vonix-backup-*.db" -mtime +30 -delete

# Optional: Upload to cloud storage
# aws s3 cp $BACKUP_DIR/vonix-backup-$DATE.db s3://your-bucket/backups/
```

Make executable and add to cron:
```bash
chmod +x /home/vonix/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /home/vonix/backup.sh
```

### Updates

```bash
# Stop application
pm2 stop vonix-network

# Backup database
npm run backup

# Pull latest code
git pull origin main

# Install dependencies
npm install
cd client && npm install && cd ..

# Build frontend
npm run build

# Start application
pm2 restart vonix-network

# Check logs
pm2 logs vonix-network --lines 50
```

For Docker:
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

---

## Firewall Configuration

### UFW (Ubuntu)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# If not using reverse proxy, allow app port
sudo ufw allow 5000/tcp

# Check status
sudo ufw status
```

### iptables

```bash
# Allow HTTP/HTTPS
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Save rules
sudo netfilter-persistent save
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs vonix-network

# Check if port is in use
sudo lsof -i :5000

# Check environment variables
pm2 env 0

# Check file permissions
ls -la /path/to/vonix-network

# Test manually
NODE_ENV=production node server/index.js
```

### Database Errors

```bash
# Check database file
ls -la data/vonix.db

# Check write permissions
touch data/test.txt && rm data/test.txt

# Restore from backup
cp backups/vonix-backup-latest.db data/vonix.db
```

### High Memory Usage

```bash
# Check PM2 memory
pm2 monit

# Restart application
pm2 restart vonix-network

# Check for memory leaks
node --inspect server/index.js
```

### WebSocket Connection Issues

```bash
# Check Nginx WebSocket config
sudo nginx -t

# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Host: vonix.network" \
  -H "Origin: https://vonix.network" \
  https://vonix.network/ws/chat
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### High CPU Usage

```bash
# Check PM2 metrics
pm2 describe vonix-network

# Check nginx workers
ps aux | grep nginx

# Adjust PM2 instances
pm2 scale vonix-network 1  # Scale down
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=5001
```

---

## Scaling

### Horizontal Scaling

For high traffic, use PM2 cluster mode:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'vonix-network',
    script: 'server/index.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    // ...
  }]
};
```

### Load Balancing

For multiple servers, use Nginx load balancing:

```nginx
upstream vonix_cluster {
    least_conn;
    server 10.0.0.1:5000;
    server 10.0.0.2:5000;
    server 10.0.0.3:5000;
}

server {
    location / {
        proxy_pass http://vonix_cluster;
        # ...
    }
}
```

### Database Scaling

For SQLite limits, consider migrating to PostgreSQL:
- Install PostgreSQL
- Update database layer
- Migrate data
- Update connection config

---

## Security Hardening

### System

```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y

# Install fail2ban (brute force protection)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban

# Disable root SSH login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd

# Setup automatic security updates
sudo apt install -y unattended-upgrades
```

### Application

- Use strong JWT secret (64+ characters)
- Enable rate limiting
- Configure CORS properly
- Use HTTPS only
- Implement CSP headers
- Enable error tracking (Sentry)
- Regular dependency updates

---

## Cheat Sheet

```bash
# Docker
docker-compose up -d              # Start
docker-compose down               # Stop
docker-compose logs -f            # Logs
docker-compose restart            # Restart

# PM2
pm2 start server/index.js         # Start
pm2 stop vonix-network            # Stop
pm2 restart vonix-network         # Restart
pm2 logs vonix-network            # Logs
pm2 monit                         # Monitor

# Nginx
sudo nginx -t                     # Test config
sudo systemctl reload nginx       # Reload
sudo systemctl restart nginx      # Restart

# SSL
sudo certbot renew                # Renew certificate
sudo certbot certificates         # Check certificates

# Backup
npm run backup                    # Backup database
cp data/vonix.db backups/         # Manual backup

# Monitoring
curl http://localhost:5000/api/health  # Health check
pm2 status                        # PM2 status
sudo systemctl status nginx       # Nginx status
```

---

## Support

- **Documentation**: [README.md](README.md)
- **API Docs**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Issues**: GitHub Issues
- **Discord**: Community server
- **Email**: support@vonix.network

---

**Last Updated**: 2025-01-15
