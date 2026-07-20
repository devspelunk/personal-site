import "server-only"

import config from "@payload-config"
import { getPayload as getPayloadInstance, type Payload } from "payload"

/**
 * Thin, memoized Payload accessor for server components and other server-only
 * code — the Payload analogue of `createDirectusServerClient`.
 *
 * Payload's own `getPayload` already caches on the module scope (and handles
 * HMR reloads in dev), but we additionally memoize the init promise here so
 * every server-side caller shares a single initialization. Always resolve
 * Payload through this helper rather than calling `getPayload({ config })`
 * directly.
 */
let cached: Promise<Payload> | undefined

export const getPayload = (): Promise<Payload> => {
  if (!cached) {
    cached = getPayloadInstance({ config })
  }

  return cached
}
