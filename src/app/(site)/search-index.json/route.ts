import { bodyExcerpt } from "@/lib/lexical/body"
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

type NameById = Map<number, string>

/** Tag names for a doc's tag relations (ids at depth 0, or populated docs). */
function tagNames(tags: (number | Tag)[] | null | undefined, names: NameById): string[] {
  return (tags ?? []).flatMap((tag) => {
    const name = typeof tag === "object" ? tag.name : names.get(tag)
    return name ? [name] : []
  })
}

/** Campaign name for a doc's campaign relation, or null. */
function campaignName(
  campaign: (number | null) | Campaign | undefined,
  names: NameById
): string | null {
  if (campaign == null) return null
  return typeof campaign === "object" ? campaign.name : (names.get(campaign) ?? null)
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

    // Depth 0: bodies arrive unpopulated (no uploads or links resolved), which
    // is all the excerpt rule needs. Tag and campaign names come from two
    // lookups instead of populating every relation.
    const find = { depth: 0, limit: 0, ...PUBLIC_READ } as const
    const [blogPosts, projects, journals, characters, lore, homebrew, tags, campaigns] =
      await Promise.all([
        payload.find({ collection: "blog-posts", ...find }),
        payload.find({ collection: "projects", ...find }),
        payload.find({ collection: "ttrpg-journals", ...find }),
        payload.find({ collection: "ttrpg-characters", ...find }),
        payload.find({ collection: "ttrpg-lore", ...find }),
        payload.find({ collection: "ttrpg-homebrew", ...find }),
        payload.find({ collection: "tags", ...find, select: { name: true } }),
        payload.find({ collection: "campaigns", ...find, select: { name: true } }),
      ])

    const tagNameById: NameById = new Map(tags.docs.map((t) => [t.id, t.name]))
    const campaignNameById: NameById = new Map(campaigns.docs.map((c) => [c.id, c.name]))

    for (const post of blogPosts.docs) {
      entries.push({
        id: `blog-${post.id}`,
        type: "blog",
        title: post.title,
        description: bodyExcerpt(post.body, post.excerpt),
        tags: tagNames(post.tags, tagNameById),
        slug: post.slug,
        url: `/blog/${post.slug}`,
      })
    }

    for (const project of projects.docs) {
      entries.push({
        id: `project-${project.id}`,
        type: "project",
        title: project.title,
        description: bodyExcerpt(project.description, project.short_description),
        tags: tagNames(project.tags, tagNameById),
        slug: project.slug,
        url: `/projects/${project.slug}`,
      })
    }

    for (const j of journals.docs) {
      const campaign = campaignName(j.campaign, campaignNameById)
      entries.push({
        id: `journal-${j.id}`,
        type: "journal",
        title: j.title,
        description: bodyExcerpt(j.body, j.excerpt),
        tags: campaign ? [campaign] : [],
        slug: j.slug,
        url: `/ttrpg/journals/${j.slug}`,
      })
    }

    for (const c of characters.docs) {
      const campaign = campaignName(c.campaign, campaignNameById)
      entries.push({
        id: `character-${c.id}`,
        type: "character",
        title: c.name,
        description: bodyExcerpt(c.backstory, c.class_role),
        tags: campaign ? [campaign] : [],
        slug: c.slug,
        url: `/ttrpg/characters/${c.slug}`,
      })
    }

    for (const l of lore.docs) {
      const campaign = campaignName(l.campaign, campaignNameById)
      entries.push({
        id: `lore-${l.id}`,
        type: "lore",
        title: l.title,
        description: bodyExcerpt(l.body),
        tags: [l.category, ...(campaign ? [campaign] : [])],
        slug: l.slug,
        url: `/ttrpg/lore/${l.slug}`,
      })
    }

    for (const h of homebrew.docs) {
      const campaign = campaignName(h.campaign, campaignNameById)
      entries.push({
        id: `homebrew-${h.id}`,
        type: "homebrew",
        title: h.title,
        description: bodyExcerpt(h.body),
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
