import type { GlobalConfig } from "payload"

// Mirrors the Directus `site_settings` singleton.
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  fields: [
    {
      name: "full_name",
      type: "text",
    },
    {
      name: "role",
      type: "text",
    },
    {
      name: "tagline",
      type: "text",
    },
    {
      name: "bio_markdown",
      type: "textarea",
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "resume_pdf",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "github_username",
      type: "text",
    },
    {
      name: "linkedin_url",
      type: "text",
    },
    {
      name: "twitter_url",
      type: "text",
    },
    {
      name: "bluesky_handle",
      type: "text",
    },
    {
      name: "email",
      type: "text",
    },
  ],
}
