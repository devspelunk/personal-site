import { getPayload } from "@/lib/payload"
import type { Campaign, Tag } from "@/payload-types"

export const revalidate = 3600

// overrideAccess: false runs `authenticatedOrPublished`, so drafted collections
// only surface published docs — drafts are never indexed for search.
const PUBLIC_READ = { overrideAccess: false } as const

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

/** Names of the tag relations Payload populated at depth >= 1. */
function tagNames(tags: (number | Tag)[] | null | undefined): string[] {
  return (tags ?? [])
    .filter((tag): tag is Tag => typeof tag === "object" && tag !== null)
    .map((tag) => tag.name)
}

/** Name of the campaign relation populated at depth >= 1, or null. */
function campaignName(
  campaign: (number | null) | Campaign | undefined
): string | null {
  return campaign && typeof campaign === "object" ? campaign.name : null
}

export async function GET() {
  // Static page entries never touch the DB, so they always render. The dynamic
  // collection entries are wrapped in try/catch so a DB-unreachable build emits
  // just the static set instead of hard-failing; runtime ISR fills in the rest.
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

  try {
    const payload = await getPayload()

    const [blogPosts, projects, journals, characters, lore, homebrew] =
      await Promise.all([
        payload.find({
          collection: "blog-posts",
          depth: 1,
          limit: 0,
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "projects",
          depth: 1,
          limit: 0,
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-journals",
          depth: 1,
          limit: 0,
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-characters",
          depth: 1,
          limit: 0,
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-lore",
          depth: 1,
          limit: 0,
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-homebrew",
          depth: 1,
          limit: 0,
          ...PUBLIC_READ,
        }),
      ])

    for (const post of blogPosts.docs) {
      entries.push({
        id: `blog-${post.id}`,
        type: "blog",
        title: post.title,
        description: post.excerpt ?? null,
        tags: tagNames(post.tags),
        slug: post.slug,
        url: `/blog/${post.slug}`,
      })
    }

    for (const project of projects.docs) {
      entries.push({
        id: `project-${project.id}`,
        type: "project",
        title: project.title,
        description: project.short_description ?? null,
        tags: tagNames(project.tags),
        slug: project.slug,
        url: `/projects/${project.slug}`,
      })
    }

    for (const j of journals.docs) {
      const campaign = campaignName(j.campaign)
      entries.push({
        id: `journal-${j.id}`,
        type: "journal",
        title: j.title,
        description: null,
        tags: campaign ? [campaign] : [],
        slug: j.slug,
        url: `/ttrpg/journals/${j.slug}`,
      })
    }

    for (const c of characters.docs) {
      const campaign = campaignName(c.campaign)
      entries.push({
        id: `character-${c.id}`,
        type: "character",
        title: c.name,
        description: null,
        tags: campaign ? [campaign] : [],
        slug: c.slug,
        url: `/ttrpg/characters/${c.slug}`,
      })
    }

    for (const l of lore.docs) {
      const campaign = campaignName(l.campaign)
      entries.push({
        id: `lore-${l.id}`,
        type: "lore",
        title: l.title,
        description: null,
        tags: [l.category, ...(campaign ? [campaign] : [])],
        slug: l.slug,
        url: `/ttrpg/lore/${l.slug}`,
      })
    }

    for (const h of homebrew.docs) {
      const campaign = campaignName(h.campaign)
      entries.push({
        id: `homebrew-${h.id}`,
        type: "homebrew",
        title: h.title,
        description: null,
        tags: [h.type, ...(campaign ? [campaign] : [])],
        slug: h.slug,
        url: `/ttrpg/homebrew/${h.slug}`,
      })
    }
  } catch (error) {
    console.error("[search-index] payload fetch failed", error)
  }

  return new Response(JSON.stringify(entries), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=3600",
    },
  })
}
