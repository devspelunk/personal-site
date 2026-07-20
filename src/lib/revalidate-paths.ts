/**
 * Maps a Payload collection (or global) slug to the set of rendered paths that
 * must be revalidated when a document in that collection changes.
 *
 * Keyed on the **kebab-case Payload slugs** (`blog-posts`, `ttrpg-journals`,
 * `career-entries`, `site-settings`, …) — NOT the legacy snake_case Directus
 * collection names. An unknown slug returns an empty array (silent no-op)
 * rather than throwing, so a collection that doesn't need revalidation (e.g.
 * `tags`, `media`, `users`) simply produces no paths.
 *
 * This module is intentionally free of framework side effects (no `next/cache`,
 * no `server-only`) so the mapping can be unit-tested in isolation. The actual
 * `revalidatePath` calls live in `revalidate-hooks.ts`.
 */

export type RevalidateArgs = {
  /** Current document slug (for detail-page revalidation). */
  slug?: string
  /** Prior document slug — revalidates the old detail path on a slug change. */
  previousSlug?: string
}

/** Collection slugs that own a detail route keyed by slug. */
function addDetailPath(
  paths: Set<string>,
  collection: string,
  slug: string | undefined
): void {
  if (!slug) return

  switch (collection) {
    case "blog-posts":
      paths.add(`/blog/${slug}`)
      break
    case "projects":
      paths.add(`/projects/${slug}`)
      break
    case "ttrpg-journals":
      paths.add(`/ttrpg/journals/${slug}`)
      break
    case "ttrpg-characters":
      paths.add(`/ttrpg/characters/${slug}`)
      break
    case "ttrpg-lore":
      paths.add(`/ttrpg/lore/${slug}`)
      break
    case "ttrpg-homebrew":
      paths.add(`/ttrpg/homebrew/${slug}`)
      break
    default:
      break
  }
}

/**
 * Computes the list of paths to revalidate for a given Payload collection or
 * global slug. Includes the current detail path and, on a slug change, the
 * previous detail path. Unknown slugs return `[]`.
 */
export function pathsForCollection(
  collection: string,
  { slug, previousSlug }: RevalidateArgs = {}
): string[] {
  const paths = new Set<string>()

  switch (collection) {
    case "blog-posts":
      paths.add("/")
      paths.add("/blog")
      paths.add("/feed.xml")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      break
    case "projects":
      paths.add("/")
      paths.add("/projects")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      break
    case "ttrpg-journals":
    case "ttrpg-characters":
    case "ttrpg-lore":
    case "ttrpg-homebrew":
      paths.add("/ttrpg")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      break
    case "career-entries":
    case "testimonials":
    case "tech-stack-items":
    case "site-settings":
      paths.add("/")
      paths.add("/about")
      paths.add("/sitemap.xml")
      paths.add("/search-index.json")
      break
    default:
      // Unknown / non-revalidated slug: no paths, no throw.
      return []
  }

  addDetailPath(paths, collection, slug)
  if (previousSlug && previousSlug !== slug) {
    addDetailPath(paths, collection, previousSlug)
  }

  return [...paths]
}
