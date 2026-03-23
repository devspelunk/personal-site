import "server-only"

import { createDirectus, rest, staticToken } from "@directus/sdk"

import type { DirectusSchema } from "@/lib/types/directus"

const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL

if (!directusUrl) {
  throw new Error("NEXT_PUBLIC_DIRECTUS_URL is required")
}

export const directus = createDirectus<DirectusSchema>(directusUrl).with(rest())

export const createDirectusServerClient = () => {
  const token = process.env.DIRECTUS_TOKEN

  if (!token) {
    throw new Error("DIRECTUS_TOKEN is required for server requests")
  }

  return createDirectus<DirectusSchema>(directusUrl)
    .with(staticToken(token))
    .with(rest())
}
