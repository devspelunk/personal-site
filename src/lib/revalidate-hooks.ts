import { revalidatePath } from "next/cache"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload"

import { pathsForCollection, type RevalidateArgs } from "./revalidate-paths"

/**
 * Shared revalidation helpers wired into Payload collection/global hooks.
 *
 * NOTE: This module is part of the Payload config's import graph (collections
 * import it), so it must NOT import `server-only` — that would throw when the
 * config is loaded outside the Next react-server bundler (migrations,
 * `generate:types`, etc.). Importing `next/cache` at the top level is safe:
 * it resolves cleanly and only throws if `revalidatePath` is *called* outside
 * a request context, which we guard against below.
 */

/** Normalizes a slug-ish value off a Payload doc, ignoring empty/non-strings. */
function toSlug(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined
}

/**
 * Revalidates every rendered path affected by a change to `collection`.
 * Swallows (and logs) errors so a failed revalidation never aborts the
 * underlying Payload write — e.g. when a hook runs from a script using the
 * Local API, outside any Next.js request context where `revalidatePath` is
 * unavailable.
 */
export function revalidateCollectionPaths(
  collection: string,
  args: RevalidateArgs = {}
): string[] {
  const paths = pathsForCollection(collection, args)

  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch (error) {
      console.error(
        `[revalidate] failed to revalidate "${path}" for "${collection}":`,
        error
      )
    }
  }

  if (paths.length > 0) {
    console.log(
      `[revalidate] ${collection} -> ${paths.join(", ")}`
    )
  }

  return paths
}

/**
 * Reusable `afterChange` hook for content collections. Revalidates list/detail
 * paths for the changed doc; a slug change also revalidates the old detail
 * path via `previousDoc`.
 */
export const revalidateCollectionAfterChange: CollectionAfterChangeHook = ({
  collection,
  doc,
  previousDoc,
}) => {
  revalidateCollectionPaths(collection.slug, {
    slug: toSlug(doc?.slug),
    previousSlug: toSlug(previousDoc?.slug),
  })

  return doc
}

/** Reusable `afterDelete` hook for content collections. */
export const revalidateCollectionAfterDelete: CollectionAfterDeleteHook = ({
  collection,
  doc,
}) => {
  revalidateCollectionPaths(collection.slug, {
    slug: toSlug(doc?.slug),
  })

  return doc
}

/** Reusable `afterChange` hook for globals (no detail paths). */
export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({
  global,
  doc,
}) => {
  revalidateCollectionPaths(global.slug)

  return doc
}
