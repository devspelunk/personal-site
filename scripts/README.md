# Scripts

## Resume import (`import-resume`)

### Prerequisites

The Directus schema must be applied (ticket: Directus Content Schema & Configuration). Directus must be running and reachable at the URL configured for the app.

### Setup

1. Add `RESUME_PDF_PATH` and `DIRECTUS_ADMIN_TOKEN` to the project root `.env`, `.env.local`, or `scripts/.env` (see `.gitignore` for `scripts/.env` — it is not committed).
2. `RESUME_PDF_PATH` should point to your local PDF (never commit the PDF to this public repo).
3. Obtain an admin token in the Directus admin UI: **Settings → Access Tokens** → create a static token with permission to write the relevant collections and upload files. Put the token in `DIRECTUS_ADMIN_TOKEN`.

Ensure `NEXT_PUBLIC_DIRECTUS_URL` (or `DIRECTUS_INTERNAL_URL`) is set so the script knows which Directus instance to call.

### Running

From the repository root:

```bash
pnpm run import-resume
```

Review the dry-run JSON printed to the terminal. If the payload looks correct, confirm with `y` or `yes` when prompted. Anything else aborts without writes.

### After the script

Review imported records in the Directus admin UI. Adjust `sort_order`, fill in `experience_years` and `context` for tech stack items, and correct any parsing gaps the heuristic missed.

### Troubleshooting: `id` validation on create

Directus treats UUID primary keys without `special: [uuid]` and without a DB default as **required in the payload** on create. If your token’s policy does not allow the `id` field, the API can reject creates. This repo’s `directus/schema.yaml` marks `career_entries.id` and `tech_stack_items.id` with **`special: [uuid]`** and **`default_value: gen_random_uuid()`** so the server accepts creates reliably.

1. Re-apply schema: `pnpm run dev:services` (or your usual flow) so `directus schema apply` runs from `directus/schema.yaml`.
2. For **existing** databases that already had the old table definition, run `directus/sql/uuid-primary-defaults.sql` once against the Directus Postgres database (or add the same defaults in the SQL editor).
3. Prefer a static token for a user with **Administrator** (or policies that allow **`id`** on create for those collections).
