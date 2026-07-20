import type { CollectionConfig } from "payload"

// Drafts enabled: Directus `status` maps to Payload's `_status` version field.
export const TtrpgJournals: CollectionConfig = {
  slug: "ttrpg-journals",
  admin: {
    useAsTitle: "title",
    group: "TTRPG",
    defaultColumns: ["title", "slug", "session_number", "_status"],
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
      // Directus campaign_id (m2o -> campaigns, SET NULL on delete).
      name: "campaign",
      type: "relationship",
      relationTo: "campaigns",
    },
    {
      name: "session_number",
      type: "number",
    },
    {
      name: "body_markdown",
      type: "textarea",
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "session_date",
      type: "date",
    },
  ],
}
