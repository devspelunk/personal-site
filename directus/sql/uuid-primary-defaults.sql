-- Optional one-time migration for existing Postgres databases where `id` has no default.
-- After this, creates may omit `id` and Postgres will fill it (matches schema.yaml default).
-- Requires PostgreSQL 13+ (gen_random_uuid is built-in).
ALTER TABLE career_entries
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tech_stack_items
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
