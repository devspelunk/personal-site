import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { authenticatedOrPublished } from "../access/authenticatedOrPublished"
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from "../lib/revalidate-hooks"

// Drafts enabled: draft/published state maps to Payload's `_status` version field.
export const TtrpgHomebrew: CollectionConfig = {
  slug: "ttrpg-homebrew",
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
    defaultColumns: ["title", "slug", "type", "_status"],
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
      // Required enum (not nullable, no default).
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Character Class", value: "character_class" },
        { label: "Magic Item", value: "magic_item" },
        { label: "Rule Variant", value: "rule_variant" },
        { label: "Monster", value: "monster" },
        { label: "Spell", value: "spell" },
      ],
    },
    {
      name: "body_markdown",
      type: "textarea",
    },
  ],
}
