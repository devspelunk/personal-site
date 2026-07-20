import type { CollectionConfig } from "payload"

// No drafts: testimonials publish directly.
export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  admin: {
    useAsTitle: "author_name",
    defaultColumns: ["author_name", "author_role", "is_homepage_featured"],
  },
  fields: [
    {
      name: "quote",
      type: "textarea",
      required: true,
    },
    {
      name: "author_name",
      type: "text",
      required: true,
    },
    {
      name: "author_role",
      type: "text",
    },
    {
      name: "author_photo",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "is_homepage_featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "sort_order",
      type: "number",
    },
  ],
}
