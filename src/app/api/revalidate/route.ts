import { timingSafeEqual } from "node:crypto"

import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

function isRevalidationSecretValid(expected: string | undefined, provided: string) {
  const dummy = Buffer.alloc(32, 0)
  if (!expected) {
    timingSafeEqual(dummy, dummy)
    return false
  }
  const a = Buffer.from(expected, "utf8")
  const b = Buffer.from(provided, "utf8")
  if (a.length !== b.length) {
    timingSafeEqual(a, Buffer.alloc(a.length))
    return false
  }
  return timingSafeEqual(a, b)
}

type RevalidateBody = {
  secret?: string
  collection?: string
  slug?: string
  previous_slug?: string
  event_type?: string
}

/** Ignores empty strings, failed template substitution, and non-slug placeholders from webhook bodies. */
function normalizeSlug(raw: unknown) {
  if (typeof raw !== "string") return undefined
  const s = raw.trim()
  if (!s) return undefined
  const lower = s.toLowerCase()
  if (lower === "null" || lower === "undefined") return undefined
  if (/^\{\{[\s\S]*\}\}$/.test(s)) return undefined
  return s
}

function addDetailPath(
  paths: Set<string>,
  collection: string,
  slug: string | undefined
) {
  if (!slug) return
  switch (collection) {
    case "blog_posts":
      paths.add(`/blog/${slug}`)
      break
    case "projects":
      paths.add(`/projects/${slug}`)
      break
    case "ttrpg_journals":
      paths.add(`/ttrpg/journals/${slug}`)
      break
    case "ttrpg_characters":
      paths.add(`/ttrpg/characters/${slug}`)
      break
    case "ttrpg_lore":
      paths.add(`/ttrpg/lore/${slug}`)
      break
    case "ttrpg_homebrew":
      paths.add(`/ttrpg/homebrew/${slug}`)
      break
    default:
      break
  }
}

function pathsForCollection(collection: string, slug?: string) {
  const paths = new Set<string>()

  switch (collection) {
    case "blog_posts":
      paths.add("/")
      paths.add("/blog")
      paths.add("/feed.xml")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      addDetailPath(paths, collection, slug)
      break
    case "projects":
      paths.add("/")
      paths.add("/projects")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      addDetailPath(paths, collection, slug)
      break
    case "ttrpg_journals":
    case "ttrpg_characters":
    case "ttrpg_lore":
    case "ttrpg_homebrew":
      paths.add("/ttrpg")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      addDetailPath(paths, collection, slug)
      break
    case "career_entries":
    case "testimonials":
    case "tech_stack_items":
    case "site_settings":
      paths.add("/")
      paths.add("/about")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      break
    default:
      return null
  }

  return paths
}

export async function POST(request: Request) {
  let body: RevalidateBody
  try {
    body = (await request.json()) as RevalidateBody
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }

  if (
    body == null ||
    typeof body.secret !== "string" ||
    typeof body.collection !== "string"
  ) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }

  const expected = process.env.REVALIDATION_SECRET
  if (!isRevalidationSecretValid(expected, body.secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const slug = normalizeSlug(body.slug)
  const previousSlug = normalizeSlug(body.previous_slug)

  const pathSet = pathsForCollection(body.collection, slug)
  if (!pathSet) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }

  if (previousSlug && previousSlug !== slug) {
    addDetailPath(pathSet, body.collection, previousSlug)
  }

  const paths = [...pathSet]
  for (const p of paths) {
    revalidatePath(p)
  }

  return NextResponse.json({ revalidated: true, paths })
}
