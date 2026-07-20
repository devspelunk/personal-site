import type { GlobalConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { revalidateGlobalAfterChange } from "../lib/revalidate-hooks"

// Mirrors the Directus `site_settings` singleton.
export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    // Public read (site chrome, resume link, socials); writes require auth.
    // Globals only support `read` and `update` access controls.
    read: () => true,
    update: authenticated,
  },
  hooks: {
    afterChange: [revalidateGlobalAfterChange],
  },
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
