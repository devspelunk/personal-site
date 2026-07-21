import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from "../lib/revalidate-hooks"

// No drafts: tech stack items publish directly.
export const TechStackItems: CollectionConfig = {
  slug: "tech-stack-items",
  access: {
    // Public content — readable by anonymous REST/GraphQL clients.
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
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
      // Stored as a string (e.g. "5+"), not a number.
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
