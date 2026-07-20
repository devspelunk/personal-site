import type { CollectionConfig } from "payload"

// Drafts enabled: Directus `status` maps to Payload's `_status` version field.
export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "sort_order", "_status"],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "description_markdown",
      type: "textarea",
    },
    {
      name: "short_description",
      type: "textarea",
    },
    {
      name: "is_featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "role",
      type: "text",
    },
    {
      name: "context_constraints",
      type: "textarea",
    },
    {
      name: "outcome_impact",
      type: "textarea",
    },
    {
      name: "thumbnail",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "demo_url",
      type: "text",
    },
    {
      name: "repo_url",
      type: "text",
    },
    {
      name: "sort_order",
      type: "number",
    },
    {
      // Directus junction table projects_tags becomes a hasMany relationship.
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
  ],
}
