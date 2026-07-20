import path from "path"
import { fileURLToPath } from "url"

import type { NextConfig } from "next"
import { withPayload } from "@payloadcms/next/withPayload"

const dirname = path.dirname(fileURLToPath(import.meta.url))

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL

const remotePattern = (() => {
  if (!directusUrl) {
    return []
  }

  try {
    const parsedUrl = new URL(directusUrl)

    return [
      {
        protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
        hostname: parsedUrl.hostname,
      },
    ]
  } catch {
    return []
  }
})()

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: dirname,
  images: {
    remotePatterns: remotePattern,
  },
}

export default withPayload(nextConfig)
