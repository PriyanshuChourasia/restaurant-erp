# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/restaurant-ui ./apps/restaurant-ui

RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM deps AS builder

WORKDIR /app

RUN pnpm --filter @repo/restaurant-ui build

# ---------- Nginx ----------
FROM nginx:alpine

COPY --from=builder /app/apps/restaurant-ui/dist /usr/share/nginx/html
COPY apps/restaurant-ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
