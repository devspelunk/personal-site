import type { CollectionConfig } from "payload"

// `status` here is a CONTENT field (active/completed/archived), not drafts.
// Campaigns publish directly (no versions/drafts). Grouped under TTRPG in the
// admin nav since it is the parent of the four TTRPG collections.
export const Campaigns: CollectionConfig = {
  slug: "campaigns",
  admin: {
    useAsTitle: "name",
    group: "TTRPG",
    defaultColumns: ["name", "slug", "status"],
  },
  fields: [
    {
      name: "name",
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
      name: "description",
      type: "textarea",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Completed", value: "completed" },
        { label: "Archived", value: "archived" },
      ],
    },
  ],
}
