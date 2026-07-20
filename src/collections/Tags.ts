import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"

export const Tags: CollectionConfig = {
  slug: "tags",
  access: {
    // Public reference data — readable by anonymous REST/GraphQL clients.
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug"],
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
  ],
}
