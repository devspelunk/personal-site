# Scripts

## Resume import (`import-resume`)

Parses a resume PDF and upserts the extracted data into Payload via the Local
API (`career-entries`, `tech-stack-items`, the resume PDF into `media`, and the
`site-settings` global).

### Prerequisites

Payload must be configured and its database reachable — the script boots Payload
in-process, so the usual `DATABASE_URI` and `PAYLOAD_SECRET` env vars must be set
(and the initial migration applied). No CMS server needs to be running and no API
token is required: writes go through the Local API with `overrideAccess: true`.

### Setup

1. Add `RESUME_PDF_PATH` to the project root `.env`, `.env.local`, or
   `scripts/.env` (see `.gitignore` for `scripts/.env` — it is not committed).
2. `RESUME_PDF_PATH` should point to your local PDF (never commit the PDF to this
   public repo).

### Running

From the repository root:

```bash
pnpm run import-resume
```

Review the dry-run JSON printed to the terminal. If the payload looks correct,
confirm with `y` or `yes` when prompted. Anything else aborts without writes.

### Upsert semantics

The write step is idempotent, so re-running with the same PDF updates in place
rather than duplicating:

- `career-entries`: matched on role + company
- `tech-stack-items`: matched on name
- `media` (resume PDF): matched on filename, reused if already uploaded
- `site-settings`: single global, always updated

### After the script

Review imported records in the Payload admin UI. Adjust `sort_order`, fill in
`experience_years` and `context` for tech stack items, and correct any parsing
gaps the heuristic missed.
