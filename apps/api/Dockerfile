FROM node:22-alpine AS deps
 
WORKDIR /app
 
RUN corepack enable
 
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
 
RUN pnpm install --frozen-lockfile
 
# ---------- Build ----------
FROM deps AS builder
 
WORKDIR /app
 
COPY src ./src
 
RUN pnpm build
 
# ---------- Production ----------
FROM node:22-alpine
 
WORKDIR /app
 
ENV NODE_ENV=production
 
RUN corepack enable
 
COPY package.json pnpm-lock.yaml ./
 
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
 
EXPOSE 3000
 
CMD ["node", "dist/main.js"]