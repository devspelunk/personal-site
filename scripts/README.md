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
