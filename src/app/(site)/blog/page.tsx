import type { Metadata } from "next"

import { BlogList, type BlogListPost } from "@/components/blog/BlogList"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { lexicalReadTime } from "@/lib/lexical/render"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import type { BlogPost, Tag } from "@/payload-types"

export const revalidate = 3600

const blogDescription =
  "Articles on software engineering, architecture, and building reliable systems."

export const metadata: Metadata = {
  title: "Blog",
  description: blogDescription,
  openGraph: {
    title: "Blog",
    description: blogDescription,
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog",
    description: blogDescription,
  },
}

function normalizeTagParam(tag: string | string[] | undefined) {
  if (tag == null) return []
  return Array.isArray(tag) ? tag : [tag]
}

/** Keep only the tag relations Payload populated at depth >= 1. */
function resolveTags(tags: BlogPost["tags"]): BlogListPost["tags"] {
  return (tags ?? [])
    .filter((tag): tag is Tag => typeof tag === "object" && tag !== null)
    .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug }))
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>
}) {
  const { tag: tagParam } = await searchParams
  const selectedTagSlugs = normalizeTagParam(tagParam)

  let docs: BlogPost[] = []
  let readTimes = new Map<number, number | null>()
  try {
    const payload = await getPayload()
    // overrideAccess: false runs `authenticatedOrPublished`, which constrains
    // anonymous reads to published docs (Local API otherwise defaults to
    // overrideAccess: true and would leak drafts).
    const query = {
      collection: "blog-posts",
      overrideAccess: false,
      sort: "-date_published",
      limit: 100,
    } as const
    // Tags need depth 1, but the body is only read for its text (read time), so
    // it comes from a depth-0 query rather than populating its uploads/links.
    const [result, bodies] = await Promise.all([
      payload.find({ ...query, depth: 1, select: { body: false } }),
      payload.find({ ...query, depth: 0, select: { body: true } }),
    ])
    docs = result.docs
    readTimes = new Map(bodies.docs.map((doc) => [doc.id, lexicalReadTime(doc.body)]))
  } catch (error) {
    console.error("[BlogPage] payload.find blog-posts (published list) failed", error)
  }

  const posts: BlogListPost[] = docs.map((doc) => ({
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    date_published: doc.date_published ?? null,
    readTime: readTimes.get(doc.id) ?? null,
    tags: resolveTags(doc.tags),
  }))

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "Blog", url: `${siteUrl}/blog` },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />
      <SectionHeading command="$ ls ~/blog" variant="page" />
      <BlogList posts={posts} selectedTagSlugs={selectedTagSlugs} />
    </div>
  )
}
