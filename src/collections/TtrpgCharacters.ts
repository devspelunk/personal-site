import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { authenticatedOrPublished } from "../access/authenticatedOrPublished"
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from "../lib/revalidate-hooks"

// Drafts enabled: draft/published state maps to Payload's `_status` version field.
export const TtrpgCharacters: CollectionConfig = {
  slug: "ttrpg-characters",
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
    useAsTitle: "name",
    group: "TTRPG",
    defaultColumns: ["name", "slug", "class_role", "_status"],
  },
  versions: {
    drafts: true,
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
      name: "campaign",
      type: "relationship",
      relationTo: "campaigns",
    },
    {
      name: "class_role",
      type: "text",
    },
    {
      name: "backstory_markdown",
      type: "textarea",
    },
    {
      name: "stats_overview",
      type: "textarea",
    },
    {
      name: "portrait",
      type: "upload",
      relationTo: "media",
    },
  ],
}
