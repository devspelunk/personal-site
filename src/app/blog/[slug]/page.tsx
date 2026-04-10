import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { readItems, readSingleton } from "@directus/sdk"
import readingTime from "reading-time"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { RelatedPosts } from "@/components/blog/RelatedPosts"
import { TableOfContents } from "@/components/blog/TableOfContents"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass, formatDate } from "@/lib/utils"

export const revalidate = 3600

type BlogPostTag = { id: string; name: string; slug: string }

type BlogPostDetail = {
  id: string
  title: string
  slug: string
  body_markdown: string | null
  excerpt: string | null
  status: string | null
  date_published: string | null
  blog_posts_tags?: { tag_id: BlogPostTag | null }[]
}

export async function generateStaticParams() {
  const client = createDirectusServerClient()
  const posts = await client.request(
    readItems("blog_posts", {
      filter: { status: { _eq: "published" } },
      fields: ["slug"],
    })
  )
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const client = createDirectusServerClient()
  const posts = await client.request(
    readItems("blog_posts", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: ["title", "excerpt", "slug", "date_published"],
      limit: 1,
    })
  )
  const post = posts[0]
  if (!post) {
    return { title: "Post" }
  }

  const siteUrl = getServerSiteUrl()
  const url = `${siteUrl}/blog/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      url,
      publishedTime: post.date_published ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const client = createDirectusServerClient()

  const [posts, siteSettings] = await Promise.all([
    client.request(
      readItems("blog_posts", {
        filter: { slug: { _eq: slug }, status: { _eq: "published" } },
        fields: [
          "id",
          "title",
          "slug",
          "body_markdown",
          "excerpt",
          "status",
          "date_published",
          "is_featured",
          "featured_image",
          "content_hash",
          "date_created",
          "date_updated",
          { blog_posts_tags: [{ tag_id: ["id", "name", "slug"] }] },
        ],
        limit: 1,
      } as never)
    ),
    client.request(readSingleton("site_settings")),
  ])

  const post = (posts as BlogPostDetail[])[0]
  if (!post) {
    notFound()
  }

  const body = post.body_markdown ?? ""
  const { html, headings, readTime } = await renderMarkdown(body)

  const tagIds =
    post.blog_posts_tags
      ?.map((row) => row.tag_id?.id)
      .filter((id): id is string => Boolean(id)) ?? []

  const displayTags =
    post.blog_posts_tags?.filter(
      (row): row is { tag_id: BlogPostTag } => row.tag_id != null
    ) ?? []

  let relatedRaw: {
    id: string
    slug: string
    title: string
    date_published: string | null
    body_markdown: string | null
  }[] = []

  if (tagIds.length > 0) {
    relatedRaw = (await client.request(
      readItems("blog_posts", {
        filter: {
          status: { _eq: "published" },
          id: { _neq: post.id },
          blog_posts_tags: { tag_id: { _in: tagIds } },
        },
        fields: ["id", "slug", "title", "date_published", "body_markdown"],
        limit: 3,
      } as never)
    )) as typeof relatedRaw
  }

  const relatedPosts = relatedRaw.map(({ body_markdown, ...p }) => ({
    ...p,
    readTime: body_markdown
      ? Math.ceil(readingTime(body_markdown).minutes)
      : null,
  }))

  const siteUrl = getServerSiteUrl()
  const authorName = siteSettings.full_name ?? "Author"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    datePublished: post.date_published ?? undefined,
    author: {
      "@type": "Person",
      name: authorName,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  }

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "Blog", url: `${siteUrl}/blog` },
    { name: post.title, url: `${siteUrl}/blog/${post.slug}` },
  ])

  const metaParts: string[] = []
  if (post.date_published) metaParts.push(formatDate(post.date_published))
  metaParts.push(`${readTime} min read`)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
          <TableOfContents headings={headings} />
          <article className="min-w-0 flex-1">
            <Breadcrumb
              items={[{ label: "Blog", href: "/blog" }, { label: post.title }]}
            />

            <header className="mt-4 mb-8">
              <h1 className="mb-4 font-mono text-3xl font-semibold text-foreground">
                {post.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">{authorName}</span>
                {" · "}
                {metaParts.join(" · ")}
              </p>
            </header>

            <div
              id="blog-post-content"
              className={articleBodyClass}
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {displayTags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-8">
                {displayTags.map((row) => (
                  <span
                    key={row.tag_id.id}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
                  >
                    {row.tag_id.name}
                  </span>
                ))}
              </div>
            )}

            <RelatedPosts posts={relatedPosts} />
          </article>
        </div>
      </div>
    </>
  )
}
