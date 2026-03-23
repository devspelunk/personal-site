import type { NextConfig } from "next"

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
  images: {
    remotePatterns: remotePattern,
  },
}

export default nextConfig
