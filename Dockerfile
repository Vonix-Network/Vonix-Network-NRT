# Multi-stage build for production
FROM node:16-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production && \
    cd client && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN cd client && npm run build

# Production image
FROM node:16-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/client/build ./client/build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create data directory
RUN mkdir -p /app/data /app/logs /app/backups && \
    chown -R nodejs:nodejs /app/data /app/logs /app/backups

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server/index.js"]
