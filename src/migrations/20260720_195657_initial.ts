import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_blog_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__blog_posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_campaigns_status" AS ENUM('active', 'completed', 'archived');
  CREATE TYPE "public"."enum_ttrpg_journals_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ttrpg_journals_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ttrpg_characters_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ttrpg_characters_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ttrpg_lore_category" AS ENUM('faction', 'location', 'timeline', 'event', 'item');
  CREATE TYPE "public"."enum_ttrpg_lore_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ttrpg_lore_v_version_category" AS ENUM('faction', 'location', 'timeline', 'event', 'item');
  CREATE TYPE "public"."enum__ttrpg_lore_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_ttrpg_homebrew_type" AS ENUM('character_class', 'magic_item', 'rule_variant', 'monster', 'spell');
  CREATE TYPE "public"."enum_ttrpg_homebrew_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__ttrpg_homebrew_v_version_type" AS ENUM('character_class', 'magic_item', 'rule_variant', 'monster', 'spell');
  CREATE TYPE "public"."enum__ttrpg_homebrew_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"body_markdown" varchar,
  	"excerpt" varchar,
  	"is_featured" boolean DEFAULT false,
  	"featured_image_id" integer,
  	"date_published" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_blog_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "blog_posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "_blog_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_body_markdown" varchar,
  	"version_excerpt" varchar,
  	"version_is_featured" boolean DEFAULT false,
  	"version_featured_image_id" integer,
  	"version_date_published" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__blog_posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_blog_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"description_markdown" varchar,
  	"short_description" varchar,
  	"is_featured" boolean DEFAULT false,
  	"role" varchar,
  	"context_constraints" varchar,
  	"outcome_impact" varchar,
  	"thumbnail_id" integer,
  	"demo_url" varchar,
  	"repo_url" varchar,
  	"sort_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description_markdown" varchar,
  	"version_short_description" varchar,
  	"version_is_featured" boolean DEFAULT false,
  	"version_role" varchar,
  	"version_context_constraints" varchar,
  	"version_outcome_impact" varchar,
  	"version_thumbnail_id" integer,
  	"version_demo_url" varchar,
  	"version_repo_url" varchar,
  	"version_sort_order" numeric,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"status" "enum_campaigns_status" DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ttrpg_journals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"campaign_id" integer,
  	"session_number" numeric,
  	"body_markdown" varchar,
  	"excerpt" varchar,
  	"session_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ttrpg_journals_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_ttrpg_journals_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_campaign_id" integer,
  	"version_session_number" numeric,
  	"version_body_markdown" varchar,
  	"version_excerpt" varchar,
  	"version_session_date" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ttrpg_journals_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "ttrpg_characters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" varchar,
  	"campaign_id" integer,
  	"class_role" varchar,
  	"backstory_markdown" varchar,
  	"stats_overview" varchar,
  	"portrait_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ttrpg_characters_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_ttrpg_characters_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" varchar,
  	"version_campaign_id" integer,
  	"version_class_role" varchar,
  	"version_backstory_markdown" varchar,
  	"version_stats_overview" varchar,
  	"version_portrait_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ttrpg_characters_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "ttrpg_lore" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"campaign_id" integer,
  	"category" "enum_ttrpg_lore_category",
  	"body_markdown" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ttrpg_lore_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_ttrpg_lore_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_campaign_id" integer,
  	"version_category" "enum__ttrpg_lore_v_version_category",
  	"version_body_markdown" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ttrpg_lore_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "ttrpg_homebrew" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"campaign_id" integer,
  	"type" "enum_ttrpg_homebrew_type",
  	"body_markdown" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_ttrpg_homebrew_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_ttrpg_homebrew_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_campaign_id" integer,
  	"version_type" "enum__ttrpg_homebrew_v_version_type",
  	"version_body_markdown" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__ttrpg_homebrew_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "career_entries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" varchar NOT NULL,
  	"company" varchar NOT NULL,
  	"date_start" varchar NOT NULL,
  	"date_end" varchar,
  	"highlight" varchar,
  	"description_markdown" varchar,
  	"is_homepage_highlight" boolean DEFAULT false,
  	"sort_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_role" varchar,
  	"author_photo_id" integer,
  	"is_homepage_featured" boolean DEFAULT false,
  	"sort_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tech_stack_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"icon_slug" varchar,
  	"experience_years" varchar,
  	"context" varchar,
  	"sort_order" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"tags_id" integer,
  	"blog_posts_id" integer,
  	"projects_id" integer,
  	"campaigns_id" integer,
  	"ttrpg_journals_id" integer,
  	"ttrpg_characters_id" integer,
  	"ttrpg_lore_id" integer,
  	"ttrpg_homebrew_id" integer,
  	"career_entries_id" integer,
  	"testimonials_id" integer,
  	"tech_stack_items_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"full_name" varchar,
  	"role" varchar,
  	"tagline" varchar,
  	"bio_markdown" varchar,
  	"avatar_id" integer,
  	"resume_pdf_id" integer,
  	"github_username" varchar,
  	"linkedin_url" varchar,
  	"twitter_url" varchar,
  	"bluesky_handle" varchar,
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_rels" ADD CONSTRAINT "blog_posts_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_parent_id_blog_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v" ADD CONSTRAINT "_blog_posts_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_blog_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_blog_posts_v_rels" ADD CONSTRAINT "_blog_posts_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ttrpg_journals" ADD CONSTRAINT "ttrpg_journals_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_journals_v" ADD CONSTRAINT "_ttrpg_journals_v_parent_id_ttrpg_journals_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ttrpg_journals"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_journals_v" ADD CONSTRAINT "_ttrpg_journals_v_version_campaign_id_campaigns_id_fk" FOREIGN KEY ("version_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ttrpg_characters" ADD CONSTRAINT "ttrpg_characters_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ttrpg_characters" ADD CONSTRAINT "ttrpg_characters_portrait_id_media_id_fk" FOREIGN KEY ("portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_characters_v" ADD CONSTRAINT "_ttrpg_characters_v_parent_id_ttrpg_characters_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ttrpg_characters"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_characters_v" ADD CONSTRAINT "_ttrpg_characters_v_version_campaign_id_campaigns_id_fk" FOREIGN KEY ("version_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_characters_v" ADD CONSTRAINT "_ttrpg_characters_v_version_portrait_id_media_id_fk" FOREIGN KEY ("version_portrait_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ttrpg_lore" ADD CONSTRAINT "ttrpg_lore_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_lore_v" ADD CONSTRAINT "_ttrpg_lore_v_parent_id_ttrpg_lore_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ttrpg_lore"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_lore_v" ADD CONSTRAINT "_ttrpg_lore_v_version_campaign_id_campaigns_id_fk" FOREIGN KEY ("version_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ttrpg_homebrew" ADD CONSTRAINT "ttrpg_homebrew_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_homebrew_v" ADD CONSTRAINT "_ttrpg_homebrew_v_parent_id_ttrpg_homebrew_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ttrpg_homebrew"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_ttrpg_homebrew_v" ADD CONSTRAINT "_ttrpg_homebrew_v_version_campaign_id_campaigns_id_fk" FOREIGN KEY ("version_campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_author_photo_id_media_id_fk" FOREIGN KEY ("author_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaigns_fk" FOREIGN KEY ("campaigns_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ttrpg_journals_fk" FOREIGN KEY ("ttrpg_journals_id") REFERENCES "public"."ttrpg_journals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ttrpg_characters_fk" FOREIGN KEY ("ttrpg_characters_id") REFERENCES "public"."ttrpg_characters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ttrpg_lore_fk" FOREIGN KEY ("ttrpg_lore_id") REFERENCES "public"."ttrpg_lore"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ttrpg_homebrew_fk" FOREIGN KEY ("ttrpg_homebrew_id") REFERENCES "public"."ttrpg_homebrew"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_career_entries_fk" FOREIGN KEY ("career_entries_id") REFERENCES "public"."career_entries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tech_stack_items_fk" FOREIGN KEY ("tech_stack_items_id") REFERENCES "public"."tech_stack_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_resume_pdf_id_media_id_fk" FOREIGN KEY ("resume_pdf_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE UNIQUE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_featured_image_idx" ON "blog_posts" USING btree ("featured_image_id");
  CREATE INDEX "blog_posts_updated_at_idx" ON "blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");
  CREATE INDEX "blog_posts__status_idx" ON "blog_posts" USING btree ("_status");
  CREATE INDEX "blog_posts_rels_order_idx" ON "blog_posts_rels" USING btree ("order");
  CREATE INDEX "blog_posts_rels_parent_idx" ON "blog_posts_rels" USING btree ("parent_id");
  CREATE INDEX "blog_posts_rels_path_idx" ON "blog_posts_rels" USING btree ("path");
  CREATE INDEX "blog_posts_rels_tags_id_idx" ON "blog_posts_rels" USING btree ("tags_id");
  CREATE INDEX "_blog_posts_v_parent_idx" ON "_blog_posts_v" USING btree ("parent_id");
  CREATE INDEX "_blog_posts_v_version_version_slug_idx" ON "_blog_posts_v" USING btree ("version_slug");
  CREATE INDEX "_blog_posts_v_version_version_featured_image_idx" ON "_blog_posts_v" USING btree ("version_featured_image_id");
  CREATE INDEX "_blog_posts_v_version_version_updated_at_idx" ON "_blog_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_blog_posts_v_version_version_created_at_idx" ON "_blog_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_blog_posts_v_version_version__status_idx" ON "_blog_posts_v" USING btree ("version__status");
  CREATE INDEX "_blog_posts_v_created_at_idx" ON "_blog_posts_v" USING btree ("created_at");
  CREATE INDEX "_blog_posts_v_updated_at_idx" ON "_blog_posts_v" USING btree ("updated_at");
  CREATE INDEX "_blog_posts_v_latest_idx" ON "_blog_posts_v" USING btree ("latest");
  CREATE INDEX "_blog_posts_v_rels_order_idx" ON "_blog_posts_v_rels" USING btree ("order");
  CREATE INDEX "_blog_posts_v_rels_parent_idx" ON "_blog_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_blog_posts_v_rels_path_idx" ON "_blog_posts_v_rels" USING btree ("path");
  CREATE INDEX "_blog_posts_v_rels_tags_id_idx" ON "_blog_posts_v_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX "projects_thumbnail_idx" ON "projects" USING btree ("thumbnail_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_tags_id_idx" ON "projects_rels" USING btree ("tags_id");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX "_projects_v_version_version_thumbnail_idx" ON "_projects_v" USING btree ("version_thumbnail_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_tags_id_idx" ON "_projects_v_rels" USING btree ("tags_id");
  CREATE UNIQUE INDEX "campaigns_slug_idx" ON "campaigns" USING btree ("slug");
  CREATE INDEX "campaigns_updated_at_idx" ON "campaigns" USING btree ("updated_at");
  CREATE INDEX "campaigns_created_at_idx" ON "campaigns" USING btree ("created_at");
  CREATE UNIQUE INDEX "ttrpg_journals_slug_idx" ON "ttrpg_journals" USING btree ("slug");
  CREATE INDEX "ttrpg_journals_campaign_idx" ON "ttrpg_journals" USING btree ("campaign_id");
  CREATE INDEX "ttrpg_journals_updated_at_idx" ON "ttrpg_journals" USING btree ("updated_at");
  CREATE INDEX "ttrpg_journals_created_at_idx" ON "ttrpg_journals" USING btree ("created_at");
  CREATE INDEX "ttrpg_journals__status_idx" ON "ttrpg_journals" USING btree ("_status");
  CREATE INDEX "_ttrpg_journals_v_parent_idx" ON "_ttrpg_journals_v" USING btree ("parent_id");
  CREATE INDEX "_ttrpg_journals_v_version_version_slug_idx" ON "_ttrpg_journals_v" USING btree ("version_slug");
  CREATE INDEX "_ttrpg_journals_v_version_version_campaign_idx" ON "_ttrpg_journals_v" USING btree ("version_campaign_id");
  CREATE INDEX "_ttrpg_journals_v_version_version_updated_at_idx" ON "_ttrpg_journals_v" USING btree ("version_updated_at");
  CREATE INDEX "_ttrpg_journals_v_version_version_created_at_idx" ON "_ttrpg_journals_v" USING btree ("version_created_at");
  CREATE INDEX "_ttrpg_journals_v_version_version__status_idx" ON "_ttrpg_journals_v" USING btree ("version__status");
  CREATE INDEX "_ttrpg_journals_v_created_at_idx" ON "_ttrpg_journals_v" USING btree ("created_at");
  CREATE INDEX "_ttrpg_journals_v_updated_at_idx" ON "_ttrpg_journals_v" USING btree ("updated_at");
  CREATE INDEX "_ttrpg_journals_v_latest_idx" ON "_ttrpg_journals_v" USING btree ("latest");
  CREATE UNIQUE INDEX "ttrpg_characters_slug_idx" ON "ttrpg_characters" USING btree ("slug");
  CREATE INDEX "ttrpg_characters_campaign_idx" ON "ttrpg_characters" USING btree ("campaign_id");
  CREATE INDEX "ttrpg_characters_portrait_idx" ON "ttrpg_characters" USING btree ("portrait_id");
  CREATE INDEX "ttrpg_characters_updated_at_idx" ON "ttrpg_characters" USING btree ("updated_at");
  CREATE INDEX "ttrpg_characters_created_at_idx" ON "ttrpg_characters" USING btree ("created_at");
  CREATE INDEX "ttrpg_characters__status_idx" ON "ttrpg_characters" USING btree ("_status");
  CREATE INDEX "_ttrpg_characters_v_parent_idx" ON "_ttrpg_characters_v" USING btree ("parent_id");
  CREATE INDEX "_ttrpg_characters_v_version_version_slug_idx" ON "_ttrpg_characters_v" USING btree ("version_slug");
  CREATE INDEX "_ttrpg_characters_v_version_version_campaign_idx" ON "_ttrpg_characters_v" USING btree ("version_campaign_id");
  CREATE INDEX "_ttrpg_characters_v_version_version_portrait_idx" ON "_ttrpg_characters_v" USING btree ("version_portrait_id");
  CREATE INDEX "_ttrpg_characters_v_version_version_updated_at_idx" ON "_ttrpg_characters_v" USING btree ("version_updated_at");
  CREATE INDEX "_ttrpg_characters_v_version_version_created_at_idx" ON "_ttrpg_characters_v" USING btree ("version_created_at");
  CREATE INDEX "_ttrpg_characters_v_version_version__status_idx" ON "_ttrpg_characters_v" USING btree ("version__status");
  CREATE INDEX "_ttrpg_characters_v_created_at_idx" ON "_ttrpg_characters_v" USING btree ("created_at");
  CREATE INDEX "_ttrpg_characters_v_updated_at_idx" ON "_ttrpg_characters_v" USING btree ("updated_at");
  CREATE INDEX "_ttrpg_characters_v_latest_idx" ON "_ttrpg_characters_v" USING btree ("latest");
  CREATE UNIQUE INDEX "ttrpg_lore_slug_idx" ON "ttrpg_lore" USING btree ("slug");
  CREATE INDEX "ttrpg_lore_campaign_idx" ON "ttrpg_lore" USING btree ("campaign_id");
  CREATE INDEX "ttrpg_lore_updated_at_idx" ON "ttrpg_lore" USING btree ("updated_at");
  CREATE INDEX "ttrpg_lore_created_at_idx" ON "ttrpg_lore" USING btree ("created_at");
  CREATE INDEX "ttrpg_lore__status_idx" ON "ttrpg_lore" USING btree ("_status");
  CREATE INDEX "_ttrpg_lore_v_parent_idx" ON "_ttrpg_lore_v" USING btree ("parent_id");
  CREATE INDEX "_ttrpg_lore_v_version_version_slug_idx" ON "_ttrpg_lore_v" USING btree ("version_slug");
  CREATE INDEX "_ttrpg_lore_v_version_version_campaign_idx" ON "_ttrpg_lore_v" USING btree ("version_campaign_id");
  CREATE INDEX "_ttrpg_lore_v_version_version_updated_at_idx" ON "_ttrpg_lore_v" USING btree ("version_updated_at");
  CREATE INDEX "_ttrpg_lore_v_version_version_created_at_idx" ON "_ttrpg_lore_v" USING btree ("version_created_at");
  CREATE INDEX "_ttrpg_lore_v_version_version__status_idx" ON "_ttrpg_lore_v" USING btree ("version__status");
  CREATE INDEX "_ttrpg_lore_v_created_at_idx" ON "_ttrpg_lore_v" USING btree ("created_at");
  CREATE INDEX "_ttrpg_lore_v_updated_at_idx" ON "_ttrpg_lore_v" USING btree ("updated_at");
  CREATE INDEX "_ttrpg_lore_v_latest_idx" ON "_ttrpg_lore_v" USING btree ("latest");
  CREATE UNIQUE INDEX "ttrpg_homebrew_slug_idx" ON "ttrpg_homebrew" USING btree ("slug");
  CREATE INDEX "ttrpg_homebrew_campaign_idx" ON "ttrpg_homebrew" USING btree ("campaign_id");
  CREATE INDEX "ttrpg_homebrew_updated_at_idx" ON "ttrpg_homebrew" USING btree ("updated_at");
  CREATE INDEX "ttrpg_homebrew_created_at_idx" ON "ttrpg_homebrew" USING btree ("created_at");
  CREATE INDEX "ttrpg_homebrew__status_idx" ON "ttrpg_homebrew" USING btree ("_status");
  CREATE INDEX "_ttrpg_homebrew_v_parent_idx" ON "_ttrpg_homebrew_v" USING btree ("parent_id");
  CREATE INDEX "_ttrpg_homebrew_v_version_version_slug_idx" ON "_ttrpg_homebrew_v" USING btree ("version_slug");
  CREATE INDEX "_ttrpg_homebrew_v_version_version_campaign_idx" ON "_ttrpg_homebrew_v" USING btree ("version_campaign_id");
  CREATE INDEX "_ttrpg_homebrew_v_version_version_updated_at_idx" ON "_ttrpg_homebrew_v" USING btree ("version_updated_at");
  CREATE INDEX "_ttrpg_homebrew_v_version_version_created_at_idx" ON "_ttrpg_homebrew_v" USING btree ("version_created_at");
  CREATE INDEX "_ttrpg_homebrew_v_version_version__status_idx" ON "_ttrpg_homebrew_v" USING btree ("version__status");
  CREATE INDEX "_ttrpg_homebrew_v_created_at_idx" ON "_ttrpg_homebrew_v" USING btree ("created_at");
  CREATE INDEX "_ttrpg_homebrew_v_updated_at_idx" ON "_ttrpg_homebrew_v" USING btree ("updated_at");
  CREATE INDEX "_ttrpg_homebrew_v_latest_idx" ON "_ttrpg_homebrew_v" USING btree ("latest");
  CREATE INDEX "career_entries_updated_at_idx" ON "career_entries" USING btree ("updated_at");
  CREATE INDEX "career_entries_created_at_idx" ON "career_entries" USING btree ("created_at");
  CREATE INDEX "testimonials_author_photo_idx" ON "testimonials" USING btree ("author_photo_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE INDEX "tech_stack_items_updated_at_idx" ON "tech_stack_items" USING btree ("updated_at");
  CREATE INDEX "tech_stack_items_created_at_idx" ON "tech_stack_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_campaigns_id_idx" ON "payload_locked_documents_rels" USING btree ("campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_ttrpg_journals_id_idx" ON "payload_locked_documents_rels" USING btree ("ttrpg_journals_id");
  CREATE INDEX "payload_locked_documents_rels_ttrpg_characters_id_idx" ON "payload_locked_documents_rels" USING btree ("ttrpg_characters_id");
  CREATE INDEX "payload_locked_documents_rels_ttrpg_lore_id_idx" ON "payload_locked_documents_rels" USING btree ("ttrpg_lore_id");
  CREATE INDEX "payload_locked_documents_rels_ttrpg_homebrew_id_idx" ON "payload_locked_documents_rels" USING btree ("ttrpg_homebrew_id");
  CREATE INDEX "payload_locked_documents_rels_career_entries_id_idx" ON "payload_locked_documents_rels" USING btree ("career_entries_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_tech_stack_items_id_idx" ON "payload_locked_documents_rels" USING btree ("tech_stack_items_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_avatar_idx" ON "site_settings" USING btree ("avatar_id");
  CREATE INDEX "site_settings_resume_pdf_idx" ON "site_settings" USING btree ("resume_pdf_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "blog_posts" CASCADE;
  DROP TABLE "blog_posts_rels" CASCADE;
  DROP TABLE "_blog_posts_v" CASCADE;
  DROP TABLE "_blog_posts_v_rels" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "campaigns" CASCADE;
  DROP TABLE "ttrpg_journals" CASCADE;
  DROP TABLE "_ttrpg_journals_v" CASCADE;
  DROP TABLE "ttrpg_characters" CASCADE;
  DROP TABLE "_ttrpg_characters_v" CASCADE;
  DROP TABLE "ttrpg_lore" CASCADE;
  DROP TABLE "_ttrpg_lore_v" CASCADE;
  DROP TABLE "ttrpg_homebrew" CASCADE;
  DROP TABLE "_ttrpg_homebrew_v" CASCADE;
  DROP TABLE "career_entries" CASCADE;
  DROP TABLE "testimonials" CASCADE;
  DROP TABLE "tech_stack_items" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_blog_posts_status";
  DROP TYPE "public"."enum__blog_posts_v_version_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum_campaigns_status";
  DROP TYPE "public"."enum_ttrpg_journals_status";
  DROP TYPE "public"."enum__ttrpg_journals_v_version_status";
  DROP TYPE "public"."enum_ttrpg_characters_status";
  DROP TYPE "public"."enum__ttrpg_characters_v_version_status";
  DROP TYPE "public"."enum_ttrpg_lore_category";
  DROP TYPE "public"."enum_ttrpg_lore_status";
  DROP TYPE "public"."enum__ttrpg_lore_v_version_category";
  DROP TYPE "public"."enum__ttrpg_lore_v_version_status";
  DROP TYPE "public"."enum_ttrpg_homebrew_type";
  DROP TYPE "public"."enum_ttrpg_homebrew_status";
  DROP TYPE "public"."enum__ttrpg_homebrew_v_version_type";
  DROP TYPE "public"."enum__ttrpg_homebrew_v_version_status";`)
}
