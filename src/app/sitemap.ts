import type { MetadataRoute } from "next"
import { readItems } from "@directus/sdk"

import { createDirectusServerClient } from "@/lib/directus"
import { getServerSiteUrl } from "@/lib/site-url"

export const revalidate = 3600

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
    const client = createDirectusServerClient()
    const published = { status: { _eq: "published" as const } }

    const [posts, projects, journals, characters, lore, homebrew] =
      await Promise.all([
        client.request(
          readItems("blog_posts", { filter: published, fields: ["slug"] })
        ),
        client.request(
          readItems("projects", { filter: published, fields: ["slug"] })
        ),
        client.request(
          readItems("ttrpg_journals", {
            filter: published,
            fields: ["slug"],
          })
        ),
        client.request(
          readItems("ttrpg_characters", {
            filter: published,
            fields: ["slug"],
          })
        ),
        client.request(
          readItems("ttrpg_lore", { filter: published, fields: ["slug"] })
        ),
        client.request(
          readItems("ttrpg_homebrew", {
            filter: published,
            fields: ["slug"],
          })
        ),
      ])

    dynamicEntries = [
      ...posts.map((row: { slug: string }) => ({
        url: base(`/blog/${row.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...projects.map((row: { slug: string }) => ({
        url: base(`/projects/${row.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.75,
      })),
      ...journals.map((row: { slug: string }) => ({
        url: base(`/ttrpg/journals/${row.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...characters.map((row: { slug: string }) => ({
        url: base(`/ttrpg/characters/${row.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...lore.map((row: { slug: string }) => ({
        url: base(`/ttrpg/lore/${row.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
      ...homebrew.map((row: { slug: string }) => ({
        url: base(`/ttrpg/homebrew/${row.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.65,
      })),
    ]
  } catch (err) {
    console.error("[sitemap] Directus slug fetch failed:", err)
  }

  return [...staticEntries, ...dynamicEntries]
}
