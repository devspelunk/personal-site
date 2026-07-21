# Personal Site Infrastructure

A Next.js site with an embedded [Payload CMS](https://payloadcms.com/) admin,
backed by Postgres and self-hosted [Umami](https://umami.is/) analytics, served
behind Caddy.

## Prerequisites

- Docker Desktop, or Docker Engine with the Docker Compose plugin
- A VPS with ports `80` and `443` open
- A domain with DNS A records pointing to the VPS for `yourdomain.com` and
  `analytics.yourdomain.com`

The CMS admin is served by Next.js itself at `/admin` (Payload is embedded in
the app), so it needs no separate subdomain.

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

   On a clean volume the ordered startup is: `postgres` becomes healthy → the
   one-shot `migrate` service applies `src/migrations` and exits → `nextjs`
   starts.

3. Access the services:

- Next.js site: `http://localhost:3000`
- Payload admin: `http://localhost:3000/admin`
- Umami: `http://localhost:3001`

The local override file (`docker-compose.override.yml`) is applied
automatically by Docker Compose and runs Next.js in dev mode with the source
mounted. `Caddyfile.dev` proxies plain HTTP traffic on `:80`; if you want local
subdomain routing you can add matching entries in `/etc/hosts`.

### Local Next.js Development

For faster iteration you can run Next.js natively while keeping Postgres in
Docker.

Use [pnpm](https://pnpm.io/) for installs and scripts (`corepack enable pnpm` if
needed).

1. If you haven't already, copy and fill in the base env file:

   ```bash
   cp .env.example .env
   ```

2. Create the local dev override file and fill in the values from your `.env`:

   ```bash
   cp .env.development.local.example .env.development.local
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Start the backing Postgres service:

   ```bash
   pnpm dev:services
   ```

5. Apply the Payload migrations to your local database:

   ```bash
   pnpm exec payload migrate
   ```

6. Start Next.js locally:

   ```bash
   pnpm dev
   ```

7. Access the services:

- Next.js site: `http://localhost:3000`
- Payload admin: `http://localhost:3000/admin`

The first time you open `/admin`, Payload prompts you to create the initial
admin user.

## Content & Data Access

Content lives in Payload collections/globals and is read by the frontend
through Payload's **Local API** (`getPayload()` in `src/lib/payload.ts`) — there
is no separate CMS service or HTTP hop. Public pages read with
`overrideAccess: false` so drafts never leak. Uploaded media is stored on disk
under `/app/media` in the container (the `media` volume) and served same-origin
via `/api/media/file/:filename`.

## Database Migrations

Payload owns the Postgres schema via versioned migrations in `src/migrations`.

- In the Docker stack, the one-shot **`migrate`** service runs
  `pnpm exec payload migrate` after Postgres is healthy and before `nextjs`
  starts, so the schema is always in place before the app serves traffic.
- Apply migrations manually (e.g. for local native dev):

  ```bash
  pnpm exec payload migrate
  ```

- After changing a collection/global, generate a new migration:

  ```bash
  pnpm exec payload migrate:create
  ```

  Commit the generated files in `src/migrations` so they ship with the image.

## Production Deployment

The `Dockerfile` produces a Next.js standalone image (`output: 'standalone'` is
already set in `next.config.ts`) plus a `migrate` image stage.

1. Replace `yourdomain.com` in `Caddyfile` with your actual domain.
2. Copy the example environment file and fill in all required secrets:

   ```bash
   cp .env.example .env
   ```

3. Start the production stack without the local override:

   ```bash
   docker compose -f docker-compose.yml up -d
   ```

   The `migrate` service applies pending migrations before `nextjs` boots, and
   uploaded media persists in the `media` volume across restarts and redeploys.

## Replacing The Placeholder Domain

Search for `yourdomain.com` in `Caddyfile` and `README.md`, then replace it with
your actual domain before deploying.
