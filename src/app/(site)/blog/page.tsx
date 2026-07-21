import type { Metadata } from "next"
import readingTime from "reading-time"

import { BlogList, type BlogListPost } from "@/components/blog/BlogList"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
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
  const payload = await getPayload()

  let docs: BlogPost[] = []
  try {
    // overrideAccess: false runs `authenticatedOrPublished`, which constrains
    // anonymous reads to published docs (Local API otherwise defaults to
    // overrideAccess: true and would leak drafts).
    const result = await payload.find({
      collection: "blog-posts",
      depth: 1,
      overrideAccess: false,
      sort: "-date_published",
      limit: 100,
    })
    docs = result.docs
  } catch (error) {
    console.error("[BlogPage] payload.find blog-posts (published list) failed", error)
  }

  const posts: BlogListPost[] = docs.map((doc) => ({
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    excerpt: doc.excerpt ?? null,
    date_published: doc.date_published ?? null,
    readTime: doc.body_markdown
      ? Math.ceil(readingTime(doc.body_markdown).minutes)
      : null,
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
