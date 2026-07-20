import type { CollectionConfig } from "payload"

// No drafts: career entries publish directly.
export const CareerEntries: CollectionConfig = {
  slug: "career-entries",
  admin: {
    useAsTitle: "role",
    defaultColumns: ["role", "company", "date_start", "sort_order"],
  },
  fields: [
    {
      name: "role",
      type: "text",
      required: true,
    },
    {
      name: "company",
      type: "text",
      required: true,
    },
    {
      // Stored as strings in Directus (e.g. "2020", "Jan 2020"), not timestamps.
      name: "date_start",
      type: "text",
      required: true,
    },
    {
      name: "date_end",
      type: "text",
    },
    {
      name: "highlight",
      type: "text",
    },
    {
      name: "description_markdown",
      type: "textarea",
    },
    {
      name: "is_homepage_highlight",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "sort_order",
      type: "number",
    },
  ],
}
