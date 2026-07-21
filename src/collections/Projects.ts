import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { authenticatedOrPublished } from "../access/authenticatedOrPublished"
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from "../lib/revalidate-hooks"

// Drafts enabled: draft/published state maps to Payload's `_status` version field.
export const Projects: CollectionConfig = {
  slug: "projects",
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
      // Tags are modeled as a hasMany relationship.
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
  ],
}
