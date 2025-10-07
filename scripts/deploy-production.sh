#!/bin/bash

# Production Deployment Script for Vonix Network
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="vonix-network"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# Functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✓${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}✗${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    error "Please don't run this script as root"
fi

# Create logs directory if it doesn't exist
mkdir -p ./logs

log "Starting production deployment for $PROJECT_NAME"

# 1. Pre-deployment checks
log "Running pre-deployment checks..."

# Check if .env exists
if [ ! -f ".env" ]; then
    error ".env file not found. Please create it from .env.example"
fi

# Check if JWT_SECRET is set and not default
if grep -q "your-super-secret-jwt-key-change-this" .env; then
    error "JWT_SECRET is still set to default value. Please change it!"
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="16.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    error "Node.js version $NODE_VERSION is too old. Minimum required: $REQUIRED_VERSION"
fi

success "Pre-deployment checks passed"

# 2. Backup current database
log "Creating database backup..."
if [ -f "./data/vonix.db" ]; then
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre-deploy-$(date +%Y%m%d-%H%M%S).db"
    cp "./data/vonix.db" "$BACKUP_FILE"
    success "Database backed up to $BACKUP_FILE"
else
    warning "No existing database found to backup"
fi

# 3. Stop existing application
log "Stopping existing application..."
if command -v pm2 &> /dev/null; then
    pm2 stop $PROJECT_NAME || warning "PM2 process not running"
    pm2 delete $PROJECT_NAME || warning "PM2 process not found"
    success "PM2 process stopped"
elif command -v docker-compose &> /dev/null; then
    docker-compose down || warning "Docker containers not running"
    success "Docker containers stopped"
else
    warning "No process manager found (PM2 or Docker)"
fi

# 4. Install/update dependencies
log "Installing backend dependencies..."
npm ci --only=production
success "Backend dependencies installed"

log "Installing frontend dependencies..."
cd client
npm ci --only=production
cd ..
success "Frontend dependencies installed"

# 5. Run security audit
log "Running security audit..."
npm audit --audit-level=high || warning "Security vulnerabilities found - please review"

# 6. Run tests
log "Running tests..."
npm test || error "Tests failed - deployment aborted"
success "All tests passed"

# 7. Build frontend
log "Building frontend for production..."
cd client
npm run build
cd ..
success "Frontend built successfully"

# 8. Validate environment
log "Validating environment configuration..."
node -e "require('./server/utils/env-validator').validateEnvironment()" || error "Environment validation failed"
success "Environment validation passed"

# 9. Start application
log "Starting application..."

if command -v pm2 &> /dev/null; then
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    pm2 save
    success "Application started with PM2"
    
    # Wait for startup
    sleep 5
    
    # Check if running
    if pm2 list | grep -q "$PROJECT_NAME.*online"; then
        success "Application is running"
    else
        error "Application failed to start"
    fi
    
elif [ -f "docker-compose.yml" ]; then
    # Start with Docker
    docker-compose up -d --build
    success "Application started with Docker"
    
    # Wait for startup
    sleep 10
    
    # Check if running
    if docker-compose ps | grep -q "Up"; then
        success "Containers are running"
    else
        error "Containers failed to start"
    fi
    
else
    # Start manually
    NODE_ENV=production nohup node server/index.js > ./logs/app.log 2>&1 &
    APP_PID=$!
    echo $APP_PID > ./app.pid
    success "Application started manually (PID: $APP_PID)"
fi

# 10. Health check
log "Running health check..."
sleep 5

# Try health check endpoint
HEALTH_URL="http://localhost:${PORT:-5000}/api/health"
if curl -f -s "$HEALTH_URL" > /dev/null; then
    success "Health check passed"
else
    error "Health check failed - application may not be running correctly"
fi

# 11. Post-deployment tasks
log "Running post-deployment tasks..."

# Clean old logs (keep last 30 days)
find ./logs -name "*.log" -mtime +30 -delete 2>/dev/null || true

# Clean old backups (keep last 30 days)
find "$BACKUP_DIR" -name "*.db" -mtime +30 -delete 2>/dev/null || true

success "Post-deployment cleanup completed"

# 12. Final status
log "Deployment completed successfully!"

echo ""
echo -e "${GREEN}🎉 Deployment Summary${NC}"
echo "=================================="
echo "✓ Database backed up"
echo "✓ Dependencies updated"
echo "✓ Tests passed"
echo "✓ Frontend built"
echo "✓ Application started"
echo "✓ Health check passed"
echo ""
echo -e "${BLUE}Application URLs:${NC}"
echo "🌐 Frontend: http://localhost:${PORT:-5000}"
echo "📚 API Docs: http://localhost:${PORT:-5000}/api-docs"
echo "🔍 Health: http://localhost:${PORT:-5000}/api/health"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"

if command -v pm2 &> /dev/null; then
    echo "📊 Monitor: pm2 monit"
    echo "📋 Logs: pm2 logs $PROJECT_NAME"
    echo "🔄 Restart: pm2 restart $PROJECT_NAME"
elif command -v docker-compose &> /dev/null; then
    echo "📋 Logs: docker-compose logs -f"
    echo "🔄 Restart: docker-compose restart"
    echo "📊 Status: docker-compose ps"
else
    echo "📋 Logs: tail -f ./logs/app.log"
    echo "🔄 Restart: kill \$(cat app.pid) && NODE_ENV=production nohup node server/index.js > ./logs/app.log 2>&1 &"
fi

echo ""
echo -e "${GREEN}Deployment completed at $(date)${NC}"
echo "Log file: $LOG_FILE"

# Exit successfully
exit 0
