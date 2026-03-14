# Directus Bootstrap Assets

This folder contains reproducible Directus setup assets for local and CI bootstrap:

- `schema.yaml` - Directus schema snapshot applied via `directus schema apply`.
- `bootstrap.sh` - one-shot setup script (schema apply + API post-setup).
- `flows/revalidation-flow.json` - JSON payload used to create the revalidation Flow.
- `flows/content-hash-flow.json` - JSON payload used to keep `blog_posts.content_hash` in sync.

## Storage and Assets

- Uploads are persisted in the Docker volume `directus_uploads`.
- Uploaded file assets are served from:
  - `https://cms.yourdomain.com/assets/{id}`
- Ensure the token in `DIRECTUS_TOKEN` has read access to `directus_files` so Next.js can resolve and render image URLs.

## `next/image` Host Configuration

Add `cms.yourdomain.com` to the `images.remotePatterns` list in `next.config.js` (planned in T3) so Directus-hosted assets can be rendered with `next/image`.

## `content_hash` Field Behavior

`blog_posts.content_hash` is computed by the bootstrap-managed `Blog Post Content Hash Sync` flow.
It recomputes and persists the hash from `title + body_markdown` on `items.create` and on `items.update` whenever either field changes.
