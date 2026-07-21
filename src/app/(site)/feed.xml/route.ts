import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"

export const revalidate = 3600

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

type FeedPost = {
  title: string
  slug: string
  excerpt: string | null
  date_published: string | null
}

export async function GET(request: Request) {
  let posts: FeedPost[]
  try {
    const payload = await getPayload()
    // overrideAccess: false runs `authenticatedOrPublished`, constraining this
    // anonymous read to published posts so drafts never appear in the feed.
    const result = await payload.find({
      collection: "blog-posts",
      depth: 0,
      overrideAccess: false,
      sort: "-date_published",
      limit: 0,
    })
    posts = result.docs.map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? null,
      date_published: post.date_published ?? null,
    }))
  } catch (error) {
    console.error("[feed.xml] payload.find blog-posts failed", error)
    const origin = new URL(request.url).origin
    const unavailable = "Feed temporarily unavailable"
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(unavailable)}</title>
    <link>${escapeXml(`${origin}/blog`)}</link>
    <description>${escapeXml(unavailable)}</description>
    <pubDate>${escapeXml(new Date().toUTCString())}</pubDate>
  </channel>
</rss>`
    return new Response(errorXml, {
      status: 503,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    })
  }

  const siteUrl = getServerSiteUrl({ request })
  const channelTitle = "Michael Lemus — Blog"
  const channelLink = `${siteUrl}/blog`
  const channelDescription =
    "Software engineering, architecture, and building reliable systems."

  const itemsXml = posts
    .map((post) => {
      const link = `${siteUrl}/blog/${post.slug}`
      const pubDate = post.date_published
        ? new Date(post.date_published).toUTCString()
        : ""
      const description = escapeXml(post.excerpt ?? "")
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${description}</description>
    </item>`
    })
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>en-us</language>
${itemsXml}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  })
}
