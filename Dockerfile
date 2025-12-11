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

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Create uploads directory
RUN mkdir -p /app/public/uploads

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
