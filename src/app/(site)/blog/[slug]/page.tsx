import type { Metadata } from "next"
import { notFound } from "next/navigation"
import readingTime from "reading-time"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { RelatedPosts } from "@/components/blog/RelatedPosts"
import { TableOfContents } from "@/components/blog/TableOfContents"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass, formatDate } from "@/lib/utils"
import type { BlogPost, Tag } from "@/payload-types"

export const revalidate = 3600

/** Keep only the tag relations Payload populated at depth >= 1. */
function resolveTags(tags: BlogPost["tags"]): Tag[] {
  return (tags ?? []).filter(
    (tag): tag is Tag => typeof tag === "object" && tag !== null
  )
}

export async function generateStaticParams() {
  const payload = await getPayload()
  const result = await payload.find({
    collection: "blog-posts",
    depth: 0,
    overrideAccess: false,
    limit: 100,
  })
  return result.docs.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload()
  const result = await payload.find({
    collection: "blog-posts",
    depth: 0,
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const post = result.docs[0]
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
  const payload = await getPayload()

  const [postsResult, siteSettings] = await Promise.all([
    payload.find({
      collection: "blog-posts",
      depth: 1,
      overrideAccess: false,
      where: { slug: { equals: slug } },
      limit: 1,
    }),
    payload.findGlobal({ slug: "site-settings", depth: 0 }),
  ])

  const post = postsResult.docs[0]
  if (!post) {
    notFound()
  }

  const body = post.body_markdown ?? ""
  const { html, headings, readTime } = await renderMarkdown(body)

  const displayTags = resolveTags(post.tags)
  const tagIds = displayTags.map((tag) => tag.id)

  let relatedDocs: BlogPost[] = []
  if (tagIds.length > 0) {
    const relatedResult = await payload.find({
      collection: "blog-posts",
      depth: 0,
      overrideAccess: false,
      where: {
        and: [{ id: { not_equals: post.id } }, { tags: { in: tagIds } }],
      },
      limit: 3,
    })
    relatedDocs = relatedResult.docs
  }

  const relatedPosts = relatedDocs.map((p) => ({
    slug: p.slug,
    title: p.title,
    date_published: p.date_published ?? null,
    readTime: p.body_markdown
      ? Math.ceil(readingTime(p.body_markdown).minutes)
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
                {displayTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
                  >
                    {tag.name}
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
