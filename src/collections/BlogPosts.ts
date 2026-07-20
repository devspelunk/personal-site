import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"
import { authenticatedOrPublished } from "../access/authenticatedOrPublished"
import {
  revalidateCollectionAfterChange,
  revalidateCollectionAfterDelete,
} from "../lib/revalidate-hooks"

// Drafts enabled: the Directus `status` (draft/published) is represented by
// Payload's built-in `_status` version field, so no explicit status field here.
export const BlogPosts: CollectionConfig = {
  slug: "blog-posts",
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
    defaultColumns: ["title", "slug", "date_published", "_status"],
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
      // Markdown source stored as plain text (NOT richText).
      name: "body_markdown",
      type: "textarea",
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "is_featured",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "featured_image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "date_published",
      type: "date",
    },
    {
      // Directus junction table blog_posts_tags becomes a hasMany relationship.
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
  ],
}
