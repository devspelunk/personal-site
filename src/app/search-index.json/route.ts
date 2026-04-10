import { readItems } from "@directus/sdk"

import { createDirectusServerClient } from "@/lib/directus"

export const revalidate = 3600

type SearchEntryType =
  | "page"
  | "blog"
  | "project"
  | "journal"
  | "character"
  | "lore"
  | "homebrew"

type SearchEntry = {
  id: string
  type: SearchEntryType
  title: string
  description: string | null
  tags: string[]
  slug: string
  url: string
}

export async function GET() {
  const client = createDirectusServerClient()

  const published = { status: { _eq: "published" as const } }

  const [campaigns, blogPosts, projects, journals, characters, lore, homebrew] =
    await Promise.all([
      client.request(readItems("campaigns", { fields: ["id", "name"] })),
      client.request(
        readItems("blog_posts", {
          filter: published,
          fields: [
            "id",
            "title",
            "excerpt",
            "slug",
            { blog_posts_tags: [{ tag_id: ["name"] }] },
          ],
        } as never)
      ),
      client.request(
        readItems("projects", {
          filter: published,
          fields: [
            "id",
            "title",
            "short_description",
            "slug",
            { projects_tags: [{ tag_id: ["name"] }] },
          ],
        } as never)
      ),
      client.request(
        readItems("ttrpg_journals", {
          filter: published,
          fields: ["id", "title", "slug", "campaign_id"],
        })
      ),
      client.request(
        readItems("ttrpg_characters", {
          filter: published,
          fields: ["id", "name", "slug", "campaign_id"],
        })
      ),
      client.request(
        readItems("ttrpg_lore", {
          filter: published,
          fields: ["id", "title", "slug", "category", "campaign_id"],
        })
      ),
      client.request(
        readItems("ttrpg_homebrew", {
          filter: published,
          fields: ["id", "title", "slug", "type", "campaign_id"],
        })
      ),
    ])

  const campaignNames = new Map(
    campaigns.map((c) => [c.id as string, c.name as string])
  )

  const entries: SearchEntry[] = [
    {
      id: "static-home",
      type: "page",
      title: "Home",
      description: "Portfolio, projects, writing, and TTRPG notes.",
      tags: [],
      slug: "",
      url: "/",
    },
    {
      id: "static-blog",
      type: "page",
      title: "Blog",
      description:
        "Articles on software engineering and building reliable systems.",
      tags: [],
      slug: "blog",
      url: "/blog",
    },
    {
      id: "static-ttrpg",
      type: "page",
      title: "TTRPG",
      description: "Session journals, characters, lore, and homebrew.",
      tags: [],
      slug: "ttrpg",
      url: "/ttrpg",
    },
    {
      id: "static-about",
      type: "page",
      title: "About",
      description: "Background, experience, and how to get in touch.",
      tags: [],
      slug: "about",
      url: "/about",
    },
    {
      id: "static-projects",
      type: "page",
      title: "Projects",
      description: "Selected work and technical write-ups.",
      tags: [],
      slug: "projects",
      url: "/projects",
    },
  ]

  const blogRows = blogPosts as {
    id: string
    title: string
    excerpt: string | null
    slug: string
    blog_posts_tags?: { tag_id: { name: string } | null }[]
  }[]

  for (const post of blogRows) {
    const tags =
      post.blog_posts_tags
        ?.map((row) => row.tag_id?.name)
        .filter((t): t is string => Boolean(t)) ?? []
    entries.push({
      id: `blog-${post.id}`,
      type: "blog",
      title: post.title,
      description: post.excerpt,
      tags,
      slug: post.slug,
      url: `/blog/${post.slug}`,
    })
  }

  const projectRows = projects as {
    id: string
    title: string
    short_description: string | null
    slug: string
    projects_tags?: { tag_id: { name: string } | null }[]
  }[]

  for (const project of projectRows) {
    const tags =
      project.projects_tags
        ?.map((row) => row.tag_id?.name)
        .filter((t): t is string => Boolean(t)) ?? []
    entries.push({
      id: `project-${project.id}`,
      type: "project",
      title: project.title,
      description: project.short_description,
      tags,
      slug: project.slug,
      url: `/projects/${project.slug}`,
    })
  }

  for (const j of journals as {
    id: string
    title: string
    slug: string
    campaign_id: string | null
  }[]) {
    const campaignTag = j.campaign_id
      ? (campaignNames.get(j.campaign_id) ?? null)
      : null
    entries.push({
      id: `journal-${j.id}`,
      type: "journal",
      title: j.title,
      description: null,
      tags: campaignTag ? [campaignTag] : [],
      slug: j.slug,
      url: `/ttrpg/journals/${j.slug}`,
    })
  }

  for (const c of characters as {
    id: string
    name: string
    slug: string
    campaign_id: string | null
  }[]) {
    const campaignTag = c.campaign_id
      ? (campaignNames.get(c.campaign_id) ?? null)
      : null
    entries.push({
      id: `character-${c.id}`,
      type: "character",
      title: c.name,
      description: null,
      tags: campaignTag ? [campaignTag] : [],
      slug: c.slug,
      url: `/ttrpg/characters/${c.slug}`,
    })
  }

  for (const l of lore as {
    id: string
    title: string
    slug: string
    category: string
    campaign_id: string | null
  }[]) {
    const campaignTag = l.campaign_id
      ? (campaignNames.get(l.campaign_id) ?? null)
      : null
    const tags = [l.category, ...(campaignTag ? [campaignTag] : [])]
    entries.push({
      id: `lore-${l.id}`,
      type: "lore",
      title: l.title,
      description: null,
      tags,
      slug: l.slug,
      url: `/ttrpg/lore/${l.slug}`,
    })
  }

  for (const h of homebrew as {
    id: string
    title: string
    slug: string
    type: string
    campaign_id: string | null
  }[]) {
    const campaignTag = h.campaign_id
      ? (campaignNames.get(h.campaign_id) ?? null)
      : null
    const tags = [h.type, ...(campaignTag ? [campaignTag] : [])]
    entries.push({
      id: `homebrew-${h.id}`,
      type: "homebrew",
      title: h.title,
      description: null,
      tags,
      slug: h.slug,
      url: `/ttrpg/homebrew/${h.slug}`,
    })
  }

  return new Response(JSON.stringify(entries), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600",
    },
  })
}
