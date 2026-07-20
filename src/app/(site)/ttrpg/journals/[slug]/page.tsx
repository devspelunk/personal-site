import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { readItems } from "@directus/sdk"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass, formatDate } from "@/lib/utils"

export const revalidate = 3600

export async function generateStaticParams() {
  const client = createDirectusServerClient()
  const rows = await client.request(
    readItems("ttrpg_journals", {
      filter: { status: { _eq: "published" } },
      fields: ["slug"],
    })
  )
  return rows.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const client = createDirectusServerClient()
  const rows = await client.request(
    readItems("ttrpg_journals", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: ["title", "excerpt", "slug"],
      limit: 1,
    })
  )
  const post = rows[0]
  if (!post) {
    return { title: "Journal" }
  }

  const siteUrl = getServerSiteUrl()
  const url = `${siteUrl}/ttrpg/journals/${post.slug}`

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
    },
  }
}

export default async function TtrpgJournalPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const client = createDirectusServerClient()

  const rows = await client.request(
    readItems("ttrpg_journals", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: [
        "id",
        "title",
        "slug",
        "session_number",
        "session_date",
        "body_markdown",
        "excerpt",
        "campaign_id",
      ],
      limit: 1,
    })
  )
  const post = rows[0]
  if (!post) {
    notFound()
  }

  let campaign: { id: string; name: string } | null = null
  if (post.campaign_id) {
    const cRows = await client.request(
      readItems("campaigns", {
        filter: { id: { _eq: post.campaign_id } },
        fields: ["id", "name"],
        limit: 1,
      })
    )
    campaign = cRows[0] ?? null
  }

  const { html } = await renderMarkdown(post.body_markdown ?? "")

  const titleLine =
    post.session_number != null
      ? `Session ${post.session_number}: ${post.title}`
      : post.title

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "TTRPG", url: `${siteUrl}/ttrpg` },
    { name: "Journals", url: `${siteUrl}/ttrpg?tab=journals` },
    {
      name: titleLine,
      url: `${siteUrl}/ttrpg/journals/${post.slug}`,
    },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />
      <article className="max-w-3xl min-w-0">
        <Breadcrumb
          items={[
            { label: "TTRPG", href: "/ttrpg" },
            { label: "Journals", href: "/ttrpg?tab=journals" },
            { label: post.title },
          ]}
        />

        <header className="mt-4 mb-8">
          <h1 className="mb-4 font-mono text-3xl font-semibold text-foreground">
            {titleLine}
          </h1>
          <p className="text-sm text-muted-foreground">
            {campaign ? (
              <Link
                href={`/ttrpg?tab=journals&campaign=${campaign.id}`}
                className="text-primary underline hover:text-foreground"
              >
                {campaign.name}
              </Link>
            ) : (
              <span>System-Agnostic</span>
            )}
            {post.session_date && (
              <>
                {" · "}
                {formatDate(post.session_date)}
              </>
            )}
          </p>
        </header>

        <div
          className={articleBodyClass}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  )
}
