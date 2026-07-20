import { timingSafeEqual } from "node:crypto"

import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { pathsForCollection } from "@/lib/revalidate-paths"

function isRevalidationSecretValid(
  expected: string | undefined,
  provided: string
) {
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

/**
 * Legacy Directus webhook receiver. Directus sends snake_case collection names
 * (`blog_posts`, `ttrpg_journals`, …); the shared path map is keyed on the
 * kebab-case Payload slugs, and every Directus name maps cleanly by swapping
 * underscores for hyphens. Kept for the transition window — T6 removes this
 * route and the `REVALIDATION_SECRET` alongside the Directus reads.
 */
function toPayloadSlug(collection: string) {
  return collection.replaceAll("_", "-")
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

  const paths = pathsForCollection(toPayloadSlug(body.collection), {
    slug,
    previousSlug,
  })

  // An unknown collection maps to no paths — reject as before.
  if (paths.length === 0) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 })
  }

  for (const p of paths) {
    revalidatePath(p)
  }

  return NextResponse.json({ revalidated: true, paths })
}
