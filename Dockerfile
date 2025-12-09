# Dockerfile for Railway deployment
FROM node:18-alpine

WORKDIR /app

# Increase Node.js memory limit for build
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Copy package files
COPY package*.json ./

# Install dependencies with reduced memory usage
RUN npm install --legacy-peer-deps --maxsockets 1

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Expose the port (Railway will set PORT env var)
EXPOSE 5000

# Health check using wget (available in Alpine)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/ultra-health || exit 1

# Start the server
CMD ["npm", "start"]