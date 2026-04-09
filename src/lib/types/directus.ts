export interface BlogPost {
  id: string
  title: string
  slug: string
  body_markdown: string | null
  excerpt: string | null
  status: "draft" | "published" | null
  is_featured: boolean
  featured_image: string | null
  content_hash: string | null
  date_published: string | null
  date_created: string | null
  date_updated: string | null
}

export interface Tag {
  id: string
  name: string
  slug: string
  date_created: string | null
  date_updated: string | null
}

export interface BlogPostTag {
  id: string
  blog_post_id: string
  tag_id: string
  date_created: string | null
  date_updated: string | null
}

export interface SocialPublishLog {
  id: string
  blog_post_id: string
  platform: "linkedin" | "twitter" | "bluesky"
  status: "unsent" | "sending" | "sent" | "failed" | "outdated"
  draft_text: string | null
  content_hash_at_send: string | null
  sent_at: string | null
  error_message: string | null
  date_created: string | null
  date_updated: string | null
}

export interface Project {
  id: string
  title: string
  slug: string
  description_markdown: string | null
  short_description: string | null
  is_featured: boolean
  role: string | null
  context_constraints: string | null
  outcome_impact: string | null
  thumbnail: string | null
  demo_url: string | null
  repo_url: string | null
  sort_order: number | null
  status: "draft" | "published" | null
  date_created: string | null
  date_updated: string | null
}

export interface ProjectTag {
  id: string
  project_id: string
  tag_id: string
  date_created: string | null
  date_updated: string | null
}

export interface Campaign {
  id: string
  name: string
  slug: string
  description: string | null
  status: "active" | "completed" | "archived" | null
  date_created: string | null
  date_updated: string | null
}

export interface TtrpgJournal {
  id: string
  campaign_id: string | null
  title: string
  slug: string
  session_number: number | null
  body_markdown: string | null
  excerpt: string | null
  session_date: string | null
  status: "draft" | "published" | null
  date_created: string | null
  date_updated: string | null
}

export interface TtrpgCharacter {
  id: string
  campaign_id: string | null
  name: string
  slug: string
  class_role: string | null
  backstory_markdown: string | null
  stats_overview: string | null
  portrait: string | null
  status: "draft" | "published" | null
  date_created: string | null
  date_updated: string | null
}

export interface TtrpgLore {
  id: string
  campaign_id: string | null
  title: string
  slug: string
  category: "faction" | "location" | "timeline" | "event" | "item"
  body_markdown: string | null
  status: "draft" | "published" | null
  date_created: string | null
  date_updated: string | null
}

export interface TtrpgHomebrew {
  id: string
  campaign_id: string | null
  title: string
  slug: string
  type: "character_class" | "magic_item" | "rule_variant" | "monster" | "spell"
  body_markdown: string | null
  status: "draft" | "published" | null
  date_created: string | null
  date_updated: string | null
}

export interface CareerEntry {
  id: string
  role: string
  company: string
  date_start: string
  date_end: string | null
  highlight: string | null
  description_markdown: string | null
  is_homepage_highlight: boolean
  sort_order: number | null
  date_created: string | null
  date_updated: string | null
}

export interface Testimonial {
  id: string
  quote: string
  author_name: string
  author_role: string | null
  author_photo: string | null
  is_homepage_featured: boolean
  sort_order: number | null
  date_created: string | null
  date_updated: string | null
}

export interface TechStackItem {
  id: string
  name: string
  icon_slug: string | null
  experience_years: string | null
  context: string | null
  sort_order: number | null
  date_created: string | null
  date_updated: string | null
}

export interface SiteSettings {
  id: string
  full_name: string | null
  role: string | null
  tagline: string | null
  bio_markdown: string | null
  avatar: string | null
  resume_pdf: string | null
  github_username: string | null
  linkedin_url: string | null
  twitter_url: string | null
  bluesky_handle: string | null
  email: string | null
}

export interface DirectusSchema {
  blog_posts: BlogPost[]
  tags: Tag[]
  blog_posts_tags: BlogPostTag[]
  social_publish_logs: SocialPublishLog[]
  projects: Project[]
  projects_tags: ProjectTag[]
  campaigns: Campaign[]
  ttrpg_journals: TtrpgJournal[]
  ttrpg_characters: TtrpgCharacter[]
  ttrpg_lore: TtrpgLore[]
  ttrpg_homebrew: TtrpgHomebrew[]
  career_entries: CareerEntry[]
  testimonials: Testimonial[]
  tech_stack_items: TechStackItem[]
  site_settings: SiteSettings
}
