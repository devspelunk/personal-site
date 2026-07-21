FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_FEATURE_MUSIC

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_FEATURE_MUSIC=$NEXT_PUBLIC_FEATURE_MUSIC

RUN corepack enable pnpm && pnpm build

# Migration stage — runs `payload migrate` before the app boots. It needs the
# full dependency tree (the `payload` CLI + tsx to load the TS config) and the
# source (payload.config.ts + src/migrations), so it reuses the `deps`
# node_modules + the repo source rather than the slim runner. pnpm is enabled
# and pre-cached at build time so `pnpm exec` needs no network at runtime.
FROM node:20-alpine AS migrate

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm --version

CMD ["pnpm", "exec", "payload", "migrate"]

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Payload writes uploads under /app/media (the Media collection staticDir
# resolves to the standalone root + /media). Create it owned by the app user so
# the mounted media volume is writable.
RUN mkdir -p /app/media && chown nextjs:nodejs /app/media

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
