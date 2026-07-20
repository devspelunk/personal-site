import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { authenticatedOrPublished } from "../access/authenticatedOrPublished"
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from "../lib/revalidate-hooks"

// Drafts enabled: Directus `status` maps to Payload's `_status` version field.
export const TtrpgLore: CollectionConfig = {
  slug: "ttrpg-lore",
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [revalidateCollectionAfterChange],
    afterDelete: [revalidateCollectionAfterDelete],
  },
  admin: {
    useAsTitle: "title",
    group: "TTRPG",
    defaultColumns: ["title", "slug", "category", "_status"],
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
      name: "campaign",
      type: "relationship",
      relationTo: "campaigns",
    },
    {
      // Required enum in Directus (is_nullable: false, no default).
      name: "category",
      type: "select",
      required: true,
      options: [
        { label: "Faction", value: "faction" },
        { label: "Location", value: "location" },
        { label: "Timeline", value: "timeline" },
        { label: "Event", value: "event" },
        { label: "Item", value: "item" },
      ],
    },
    {
      name: "body_markdown",
      type: "textarea",
    },
  ],
}
