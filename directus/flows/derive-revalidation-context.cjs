module.exports = async function (data) {
  const trigger = data.$trigger || {}
  const payload = trigger.payload || {}
  const collection = trigger.collection || ""
  const event = trigger.event || ""

  const alwaysCollections = new Set([
    "career_entries",
    "testimonials",
    "tech_stack_items",
    "site_settings",
  ])

  const publishSensitiveCollections = new Set([
    "blog_posts",
    "projects",
    "ttrpg_journals",
    "ttrpg_characters",
    "ttrpg_lore",
    "ttrpg_homebrew",
  ])

  const hasOwn = (key) => Object.prototype.hasOwnProperty.call(payload, key)
  const slugChanged =
    hasOwn("slug") || hasOwn("slug_previous") || hasOwn("previous_slug")
  const statusChanged = hasOwn("status")

  let shouldRevalidate = false

  if (alwaysCollections.has(collection)) {
    shouldRevalidate = true
  } else if (publishSensitiveCollections.has(collection)) {
    if (event === "items.create") {
      shouldRevalidate = payload.status === "published"
    } else if (event === "items.update") {
      shouldRevalidate = slugChanged || statusChanged
    } else if (event === "items.delete") {
      shouldRevalidate = true
    } else {
      shouldRevalidate = false
    }
  } else {
    shouldRevalidate = true
  }

  const previousSlug = slugChanged
    ? (payload.slug_previous ?? payload.previous_slug ?? null)
    : null

  function primaryId() {
    if (Array.isArray(trigger.keys) && trigger.keys.length > 0) {
      return trigger.keys[0]
    }
    if (payload.id != null) return payload.id
    return null
  }

  async function fetchSlugFromApi() {
    const baseUrl = (
      process.env.DIRECTUS_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_DIRECTUS_URL ||
      ""
    )
      .trim()
      .replace(/\/$/, "")
    const token = (process.env.DIRECTUS_TOKEN || "").trim()
    const id = primaryId()
    if (!baseUrl || !token || !id || !collection) {
      return null
    }
    const url = `${baseUrl}/items/${collection}/${id}?fields=slug`
    const controller = new AbortController()
    const timeoutMs = 5000
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      if (!res.ok) return null
      const json = await res.json()
      return json?.data?.slug ?? null
    } catch (err) {
      const aborted = err != null && typeof err === "object" && err.name === "AbortError"
      console.error("[derive-revalidation-context] fetch slug failed", {
        url,
        aborted,
        error: err,
      })
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  function slugFromDeletePayload() {
    if (payload == null) return null
    if (Array.isArray(payload)) {
      const first = payload[0]
      if (first && typeof first === "object" && first.slug) {
        return first.slug
      }
      return null
    }
    if (typeof payload === "object" && payload.slug) {
      return payload.slug
    }
    return null
  }

  let slug = payload.slug ?? null

  if (
    publishSensitiveCollections.has(collection) &&
    (slug === null || slug === undefined || String(slug).trim() === "")
  ) {
    if (event === "items.delete") {
      slug = slugFromDeletePayload()
    } else if (event === "items.update" || event === "items.create") {
      slug = await fetchSlugFromApi()
    }
  }

  return {
    should_revalidate: shouldRevalidate,
    collection,
    event_type: event,
    slug: slug != null ? String(slug) : "",
    previous_slug: previousSlug != null ? String(previousSlug) : "",
  }
}
