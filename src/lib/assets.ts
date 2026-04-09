const rawUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL
if (!rawUrl) {
  throw new Error(
    "NEXT_PUBLIC_DIRECTUS_URL is not set. Add it to your .env file.",
  )
}
const directusUrl = rawUrl.replace(/\/+$/, "")

export const getAssetUrl = (assetId: string) =>
  `${directusUrl}/assets/${assetId}`
