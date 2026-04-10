import "server-only"

function normalizeConfiguredUrl(raw: string) {
  return raw.trim().replace(/\/$/, "")
}

function assertValidAbsoluteUrl(url: string) {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must be a valid absolute URL; received: ${url}`
    )
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL must use http or https; received: ${parsed.protocol}`
    )
  }
  return normalizeConfiguredUrl(parsed.toString())
}

function protocolFromRequestUrl(url: URL): "http" | "https" {
  return url.protocol === "https:" ? "https" : "http"
}

function validatedForwardedProto(
  forwardedProto: string | null,
  requestUrl: URL
): "http" | "https" {
  const token = forwardedProto?.split(",")[0]?.trim().toLowerCase()
  if (token === "http" || token === "https") {
    return token
  }
  return protocolFromRequestUrl(requestUrl)
}

function deriveFromRequest(request: Request) {
  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host")
  if (!hostHeader) return null
  const host = hostHeader.split(",")[0]?.trim()
  if (!host) return null
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const url = new URL(request.url)
  const proto = validatedForwardedProto(forwardedProto, url)
  return `${proto}://${host}`
}

type GetServerSiteUrlOptions = {
  /** When env is unset in production, derive origin from the incoming request (e.g. RSS route). */
  request?: Request
}

/**
 * Canonical site origin for metadata, JSON-LD, and feeds.
 * In development, falls back to http://localhost:3000 when unset.
 * In production, requires a valid NEXT_PUBLIC_SITE_URL or a `request` from which the host can be derived.
 */
export function getServerSiteUrl(options?: GetServerSiteUrlOptions) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  const isDev = process.env.NODE_ENV === "development"

  if (configured?.trim()) {
    return assertValidAbsoluteUrl(normalizeConfiguredUrl(configured))
  }

  if (isDev) {
    return "http://localhost:3000"
  }

  const derived = options?.request ? deriveFromRequest(options.request) : null
  if (derived) {
    return derived
  }

  throw new Error(
    "NEXT_PUBLIC_SITE_URL must be set to a valid absolute URL (http or https) in production."
  )
}
