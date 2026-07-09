# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build the NestJS app
RUN pnpm --filter @repo/api build

# Prune dev dependencies for production
RUN pnpm install --frozen-lockfile --prod

# ---- Production Stage ----
FROM node:22-alpine AS runner
WORKDIR /app

# Copy production artifacts from builder
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
