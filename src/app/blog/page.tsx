import type { Metadata } from "next"
import { readItems } from "@directus/sdk"
import readingTime from "reading-time"

import { BlogList, type BlogListPost } from "@/components/blog/BlogList"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { getServerSiteUrl } from "@/lib/site-url"

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

type BlogPostRow = Omit<BlogListPost, "readTime"> & {
  body_markdown: string | null
}

function normalizeTagParam(tag: string | string[] | undefined) {
  if (tag == null) return []
  return Array.isArray(tag) ? tag : [tag]
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>
}) {
  const { tag: tagParam } = await searchParams
  const selectedTagSlugs = normalizeTagParam(tagParam)
  const client = createDirectusServerClient()

  let rawPosts: BlogPostRow[]
  try {
    rawPosts = (await client.request(
      readItems("blog_posts", {
        filter: { status: { _eq: "published" } },
        sort: ["-date_published"],
        fields: [
          "id",
          "slug",
          "title",
          "excerpt",
          "date_published",
          "body_markdown",
          { blog_posts_tags: [{ tag_id: ["id", "name", "slug"] }] },
        ],
      } as never)
    )) as BlogPostRow[]
  } catch (error) {
    console.error(
      "[BlogPage] readItems blog_posts (published list) failed",
      error
    )
    rawPosts = []
  }

  const posts = rawPosts.map(({ body_markdown, ...post }) => ({
    ...post,
    readTime: body_markdown
      ? Math.ceil(readingTime(body_markdown).minutes)
      : null,
  })) satisfies BlogListPost[]

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
