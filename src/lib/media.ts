import type { Media } from "@/payload-types"

/**
 * A Payload upload field value: either a numeric id (when unpopulated / depth 0),
 * the populated `Media` object (when queried with `depth >= 1`), or null.
 */
export type MediaValue = number | Media | null | undefined

/**
 * Resolve a same-origin URL from a Payload upload field. Returns `undefined`
 * when the field is empty or was not populated (still a bare id), so callers can
 * conditionally render `<Image>` / `<img>` / links.
 *
 * Payload upload fields carry the URL on the populated object (`media.url`,
 * e.g. `/api/media/file/<name>`) rather than being built from an asset id, so
 * ensure queries use `depth >= 1`.
 */
export function getMediaUrl(value: MediaValue): string | undefined {
  return value && typeof value === "object" ? (value.url ?? undefined) : undefined
}

/** Resolve the alt text from a populated Payload upload field, if present. */
export function getMediaAlt(value: MediaValue): string | undefined {
  return value && typeof value === "object" ? (value.alt ?? undefined) : undefined
}
