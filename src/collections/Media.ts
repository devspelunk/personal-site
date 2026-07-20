import path from "path"
import { fileURLToPath } from "url"

import type { CollectionConfig } from "payload"

import { authenticated } from "../access/authenticated"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Single upload collection for every media reference (images + the resume PDF).
// Files are stored under <repo>/media and served same-origin via Payload's
// /api/media/file/:filename route.
export const Media: CollectionConfig = {
  slug: "media",
  access: {
    // MUST stay public so images + the resume PDF serve to anonymous browsers.
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    staticDir: path.resolve(dirname, "../../media"),
    // Images for avatars/thumbnails/portraits, plus PDF for resume_pdf.
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
}
