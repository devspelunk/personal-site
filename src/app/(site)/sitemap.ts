import type { MetadataRoute } from "next"

import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"

export const revalidate = 3600

// overrideAccess: false runs `authenticatedOrPublished` so only published docs
// (never drafts) are enumerated in the sitemap.
const PUBLIC_READ = { overrideAccess: false } as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getServerSiteUrl()
  const base = (u: string) => `${siteUrl}${u}`

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base("/"), changeFrequency: "weekly", priority: 1 },
    { url: base("/blog"), changeFrequency: "weekly", priority: 0.85 },
    { url: base("/ttrpg"), changeFrequency: "weekly", priority: 0.8 },
    { url: base("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: base("/projects"), changeFrequency: "weekly", priority: 0.75 },
  ]

  let dynamicEntries: MetadataRoute.Sitemap = []

  try {
    const payload = await getPayload()

    const slugs = async (
      collection:
        | "blog-posts"
        | "projects"
        | "ttrpg-journals"
        | "ttrpg-characters"
        | "ttrpg-lore"
        | "ttrpg-homebrew"
    ): Promise<string[]> => {
      const result = await payload.find({
        collection,
        depth: 0,
        limit: 0,
        select: { slug: true },
        ...PUBLIC_READ,
      })
      return result.docs.map((doc) => doc.slug)
    }

    const [posts, projects, journals, characters, lore, homebrew] =
      await Promise.all([
        slugs("blog-posts"),
        slugs("projects"),
        slugs("ttrpg-journals"),
        slugs("ttrpg-characters"),
        slugs("ttrpg-lore"),
        slugs("ttrpg-homebrew"),
      ])

    dynamicEntries = [
      ...posts.map((slug) => ({
        url: base(`/blog/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...projects.map((slug) => ({
        url: base(`/projects/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...journals.map((slug) => ({
        url: base(`/ttrpg/journals/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...characters.map((slug) => ({
        url: base(`/ttrpg/characters/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...lore.map((slug) => ({
        url: base(`/ttrpg/lore/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...homebrew.map((slug) => ({
        url: base(`/ttrpg/homebrew/${slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
    ]
  } catch (err) {
    console.error("[sitemap] Payload slug fetch failed:", err)
  }

  return [...staticEntries, ...dynamicEntries]
}
