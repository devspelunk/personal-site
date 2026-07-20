import type { CollectionConfig } from "payload"

// No drafts: tech stack items publish directly.
export const TechStackItems: CollectionConfig = {
  slug: "tech-stack-items",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "icon_slug", "experience_years", "sort_order"],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "icon_slug",
      type: "text",
    },
    {
      // String in Directus (e.g. "5+"), not a number.
      name: "experience_years",
      type: "text",
    },
    {
      name: "context",
      type: "text",
    },
    {
      name: "sort_order",
      type: "number",
    },
  ],
}
