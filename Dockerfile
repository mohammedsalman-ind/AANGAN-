# Multi-stage Docker build for AANGAN Platform
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies across all workspaces
RUN npm ci

# Copy source code
COPY tsconfig.base.json ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/

# Build shared, server, and client bundles
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy root package and workspace packages
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy compiled outputs
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 4000

CMD ["node", "server/dist/index.js"]
