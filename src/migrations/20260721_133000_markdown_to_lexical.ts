import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'

import { buildEditorConfig } from '../lib/lexical'

/**
 * Markdown → Lexical richText storage transition (Workstream A / T3).
 *
 * Retypes every long-form field from a Markdown `varchar` (`*_markdown`) to a
 * Lexical `jsonb` column under a clean name (`body` / `description` /
 * `backstory` / `bio`). Per the content audit, only `career_entries` (9) and
 * `site_settings` (1) hold data; every other content table and all six
 * `_versions` tables are empty, so those get a straight column replace with no
 * data to convert.
 *
 * For the two non-empty tables the DDL (ADD the jsonb column) precedes the data
 * write so the backfill can convert each Markdown row through
 * `convertMarkdownToLexical` and persist it via the Local API (which runs field
 * validation); the old `*_markdown` column is dropped only afterwards. All of
 * this runs inside the migration's transaction (`req`).
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Empty collections + their `_versions` tables — nothing to convert, so
  //    just drop the Markdown varchar and add the clean-named jsonb column.
  await db.execute(sql`
   ALTER TABLE "blog_posts" DROP COLUMN "body_markdown";
   ALTER TABLE "blog_posts" ADD COLUMN "body" jsonb;
   ALTER TABLE "_blog_posts_v" DROP COLUMN "version_body_markdown";
   ALTER TABLE "_blog_posts_v" ADD COLUMN "version_body" jsonb;

   ALTER TABLE "projects" DROP COLUMN "description_markdown";
   ALTER TABLE "projects" ADD COLUMN "description" jsonb;
   ALTER TABLE "_projects_v" DROP COLUMN "version_description_markdown";
   ALTER TABLE "_projects_v" ADD COLUMN "version_description" jsonb;

   ALTER TABLE "ttrpg_lore" DROP COLUMN "body_markdown";
   ALTER TABLE "ttrpg_lore" ADD COLUMN "body" jsonb;
   ALTER TABLE "_ttrpg_lore_v" DROP COLUMN "version_body_markdown";
   ALTER TABLE "_ttrpg_lore_v" ADD COLUMN "version_body" jsonb;

   ALTER TABLE "ttrpg_journals" DROP COLUMN "body_markdown";
   ALTER TABLE "ttrpg_journals" ADD COLUMN "body" jsonb;
   ALTER TABLE "_ttrpg_journals_v" DROP COLUMN "version_body_markdown";
   ALTER TABLE "_ttrpg_journals_v" ADD COLUMN "version_body" jsonb;

   ALTER TABLE "ttrpg_homebrew" DROP COLUMN "body_markdown";
   ALTER TABLE "ttrpg_homebrew" ADD COLUMN "body" jsonb;
   ALTER TABLE "_ttrpg_homebrew_v" DROP COLUMN "version_body_markdown";
   ALTER TABLE "_ttrpg_homebrew_v" ADD COLUMN "version_body" jsonb;

   ALTER TABLE "ttrpg_characters" DROP COLUMN "backstory_markdown";
   ALTER TABLE "ttrpg_characters" ADD COLUMN "backstory" jsonb;
   ALTER TABLE "_ttrpg_characters_v" DROP COLUMN "version_backstory_markdown";
   ALTER TABLE "_ttrpg_characters_v" ADD COLUMN "version_backstory" jsonb;
  `)

  // 2. Non-empty tables — add the jsonb column first, then backfill each row.
  await db.execute(sql`
   ALTER TABLE "career_entries" ADD COLUMN "description" jsonb;
   ALTER TABLE "site_settings" ADD COLUMN "bio" jsonb;
  `)

  const editorConfig = await buildEditorConfig(payload.config)

  // career_entries: 9 tight bullet-list Markdown descriptions.
  const careerRows = await db.execute(sql`
   SELECT "id", "description_markdown"
   FROM "career_entries"
   WHERE "description_markdown" IS NOT NULL;
  `)
  for (const row of careerRows.rows) {
    const markdown = row.description_markdown as string
    const description = convertMarkdownToLexical({ editorConfig, markdown })
    await payload.update({
      collection: 'career-entries',
      id: row.id as number,
      data: { description },
      req,
      overrideAccess: true,
    })
  }

  // site_settings: single global with a 1–2 paragraph bio.
  const siteRows = await db.execute(sql`
   SELECT "id", "bio_markdown"
   FROM "site_settings"
   WHERE "bio_markdown" IS NOT NULL;
  `)
  for (const row of siteRows.rows) {
    const markdown = row.bio_markdown as string
    const bio = convertMarkdownToLexical({ editorConfig, markdown })
    await payload.updateGlobal({
      slug: 'site-settings',
      data: { bio },
      req,
      overrideAccess: true,
    })
  }

  // 3. Data is migrated — drop the now-unused Markdown columns.
  await db.execute(sql`
   ALTER TABLE "career_entries" DROP COLUMN "description_markdown";
   ALTER TABLE "site_settings" DROP COLUMN "bio_markdown";
  `)
}

/**
 * Schema-only reversal. The Markdown `varchar` columns are recreated so the
 * schema matches the pre-migration shape, but the original Markdown text is NOT
 * restored — the content is regenerable (`import-resume.ts`) and git-tracked,
 * so reversibility of the *data* was intentionally dropped (see plan).
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "career_entries" ADD COLUMN "description_markdown" varchar;
   ALTER TABLE "career_entries" DROP COLUMN "description";
   ALTER TABLE "site_settings" ADD COLUMN "bio_markdown" varchar;
   ALTER TABLE "site_settings" DROP COLUMN "bio";

   ALTER TABLE "blog_posts" ADD COLUMN "body_markdown" varchar;
   ALTER TABLE "blog_posts" DROP COLUMN "body";
   ALTER TABLE "_blog_posts_v" ADD COLUMN "version_body_markdown" varchar;
   ALTER TABLE "_blog_posts_v" DROP COLUMN "version_body";

   ALTER TABLE "projects" ADD COLUMN "description_markdown" varchar;
   ALTER TABLE "projects" DROP COLUMN "description";
   ALTER TABLE "_projects_v" ADD COLUMN "version_description_markdown" varchar;
   ALTER TABLE "_projects_v" DROP COLUMN "version_description";

   ALTER TABLE "ttrpg_lore" ADD COLUMN "body_markdown" varchar;
   ALTER TABLE "ttrpg_lore" DROP COLUMN "body";
   ALTER TABLE "_ttrpg_lore_v" ADD COLUMN "version_body_markdown" varchar;
   ALTER TABLE "_ttrpg_lore_v" DROP COLUMN "version_body";

   ALTER TABLE "ttrpg_journals" ADD COLUMN "body_markdown" varchar;
   ALTER TABLE "ttrpg_journals" DROP COLUMN "body";
   ALTER TABLE "_ttrpg_journals_v" ADD COLUMN "version_body_markdown" varchar;
   ALTER TABLE "_ttrpg_journals_v" DROP COLUMN "version_body";

   ALTER TABLE "ttrpg_homebrew" ADD COLUMN "body_markdown" varchar;
   ALTER TABLE "ttrpg_homebrew" DROP COLUMN "body";
   ALTER TABLE "_ttrpg_homebrew_v" ADD COLUMN "version_body_markdown" varchar;
   ALTER TABLE "_ttrpg_homebrew_v" DROP COLUMN "version_body";

   ALTER TABLE "ttrpg_characters" ADD COLUMN "backstory_markdown" varchar;
   ALTER TABLE "ttrpg_characters" DROP COLUMN "backstory";
   ALTER TABLE "_ttrpg_characters_v" ADD COLUMN "version_backstory_markdown" varchar;
   ALTER TABLE "_ttrpg_characters_v" DROP COLUMN "version_backstory";
  `)
}
