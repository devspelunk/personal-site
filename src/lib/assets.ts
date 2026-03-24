const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL

export const getAssetUrl = (assetId: string) =>
  `${directusUrl}/assets/${assetId}`
