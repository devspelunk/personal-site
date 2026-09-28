import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { convertMarkdownToLexical } from '@payloadcms/richtext-lexical'

import { buildEditorConfig } from '../lib/lexical'

/**
 * Markdown → Lexical richText storage transition (Workstream A / T3).
 *
 * Retypes every long-form field from a Markdown `varchar` (`*_markdown`) to a
 * Lexical `jsonb` column under a clean name (`body` / `description` /
 * `backstory` / `bio`), on each collection table and its `_versions` table.
 *
 * Every column goes through the same add → backfill → drop sequence rather
 * than trusting a point-in-time content audit to say which tables are empty:
 * on an empty table the backfill is a no-op, and on a non-empty one no Markdown
 * is dropped before it has been converted. Rows are written with raw SQL (not
 * the Local API) so the backfill doesn't trigger hooks or mint new versions,
 * and so `_versions` rows can be converted in place. All of this runs inside
 * the migration's transaction.
 */
const COLUMNS: ReadonlyArray<{ table: string; from: string; to: string }> = [
  { table: 'blog_posts', from: 'body_markdown', to: 'body' },
  { table: '_blog_posts_v', from: 'version_body_markdown', to: 'version_body' },
  { table: 'projects', from: 'description_markdown', to: 'description' },
  { table: '_projects_v', from: 'version_description_markdown', to: 'version_description' },
  { table: 'ttrpg_lore', from: 'body_markdown', to: 'body' },
  { table: '_ttrpg_lore_v', from: 'version_body_markdown', to: 'version_body' },
  { table: 'ttrpg_journals', from: 'body_markdown', to: 'body' },
  { table: '_ttrpg_journals_v', from: 'version_body_markdown', to: 'version_body' },
  { table: 'ttrpg_homebrew', from: 'body_markdown', to: 'body' },
  { table: '_ttrpg_homebrew_v', from: 'version_body_markdown', to: 'version_body' },
  { table: 'ttrpg_characters', from: 'backstory_markdown', to: 'backstory' },
  { table: '_ttrpg_characters_v', from: 'version_backstory_markdown', to: 'version_backstory' },
  { table: 'career_entries', from: 'description_markdown', to: 'description' },
  { table: 'site_settings', from: 'bio_markdown', to: 'bio' },
]

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  const editorConfig = await buildEditorConfig(payload.config)

  for (const { table, from, to } of COLUMNS) {
    const t = sql.identifier(table)
    const src = sql.identifier(from)
    const dest = sql.identifier(to)

    await db.execute(sql`ALTER TABLE ${t} ADD COLUMN ${dest} jsonb;`)

    // Blank Markdown stays NULL so "no content" checks keep treating it as empty.
    const rows = await db.execute(sql`
     SELECT "id", ${src} AS "markdown"
     FROM ${t}
     WHERE ${src} IS NOT NULL AND btrim(${src}) <> '';
    `)
    for (const row of rows.rows) {
      const lexical = convertMarkdownToLexical({
        editorConfig,
        markdown: row.markdown as string,
      })
      await db.execute(sql`
       UPDATE ${t} SET ${dest} = ${JSON.stringify(lexical)}::jsonb
       WHERE "id" = ${row.id};
      `)
    }

    // Only drop the Markdown once every row has been converted.
    await db.execute(sql`ALTER TABLE ${t} DROP COLUMN ${src};`)
  }
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
