# Personal Site Infrastructure

## Prerequisites

- Docker Desktop, or Docker Engine with the Docker Compose plugin
- A VPS with ports `80` and `443` open
- A domain with DNS A records pointing to the VPS for `yourdomain.com`, `cms.yourdomain.com`, and `analytics.yourdomain.com`

## Local Development

### Full Docker Stack

1. Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

2. Start the stack:

   ```bash
   docker compose up
   ```

3. Access the services:

- Next.js: `http://localhost:3000`
- Directus: `http://localhost:8055`
- Umami: `http://localhost:3001`

The local override file is applied automatically by Docker Compose. `Caddyfile.dev` proxies plain HTTP traffic on `:80`, and if you want local subdomain routing you can add matching entries in `/etc/hosts`.
`NEXT_PUBLIC_DIRECTUS_URL` is used by the frontend, while Directus bootstrap uses an internal API URL (`DIRECTUS_INTERNAL_URL`, defaulting to `http://directus:8055` in Docker).

### Local Next.js Development

For faster iteration you can run Next.js natively while keeping the backing services in Docker.

1. If you haven't already, copy and fill in the base env file:

   ```bash
   cp .env.example .env
   ```

2. Create the local dev override file and fill in the token values from your `.env`:

   ```bash
   cp .env.development.local.example .env.development.local
   ```

3. Start the backing services (Postgres, Directus):

   ```bash
   pnpm dev:services
   ```

4. Start Next.js locally:

   ```bash
   pnpm dev
   ```

5. Access the services:

- Next.js: `http://localhost:3000`
- Directus admin: `http://localhost:8055`

## Production Deployment

1. Replace `yourdomain.com` in `Caddyfile` with your actual domain.
2. Copy the example environment file and fill in all required secrets:

   ```bash
   cp .env.example .env
   ```

3. Start the production stack without the local override:

   ```bash
   docker compose -f docker-compose.yml up -d
   ```

## Next.js `next.config.js` Requirement

The `Dockerfile` expects Next.js standalone output. You must add `output: 'standalone'` to `next.config.js` before building:

```js
// next.config.js
module.exports = { output: 'standalone' }
```

## Replacing The Placeholder Domain

Search for `yourdomain.com` in `Caddyfile` and `README.md`, then replace it with your actual domain before deploying.
