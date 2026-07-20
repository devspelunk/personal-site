import path from "path"
import { fileURLToPath } from "url"

import type { CollectionConfig } from "payload"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Single upload collection for every media reference (images + the resume PDF).
// Files are stored under <repo>/media and served same-origin via Payload's
// /api/media/file/:filename route.
export const Media: CollectionConfig = {
  slug: "media",
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
