# ---------- Dependencies ----------
FROM node:22-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages ./packages
COPY apps/resume-ui ./apps/resume-ui

RUN pnpm install --frozen-lockfile

# ---------- Build ----------
FROM deps AS builder

WORKDIR /app

RUN pnpm --filter @repo/resume-ui build

# ---------- Nginx ----------
FROM nginx:alpine

COPY --from=builder /app/apps/resume-ui/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]