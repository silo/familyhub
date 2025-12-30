FROM node:22-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production stage
FROM base AS runner
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Copy migration files for runtime migrations
COPY --from=builder /app/server/db/migrations ./server/db/migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=deps /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p /app/public/uploads

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/setup/status || exit 1

EXPOSE 3000

# Create entrypoint script
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]

