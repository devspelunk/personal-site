import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { readItems } from "@directus/sdk"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { Badge } from "@/components/ui/badge"
import { formatHomebrewTypeLabel } from "@/components/ttrpg/ttrpg-labels"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass } from "@/lib/utils"

export const revalidate = 3600

export async function generateStaticParams() {
  const client = createDirectusServerClient()
  const rows = await client.request(
    readItems("ttrpg_homebrew", {
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
    readItems("ttrpg_homebrew", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: ["title", "slug", "body_markdown", "type"],
      limit: 1,
    })
  )
  const entry = rows[0]
  if (!entry) {
    return { title: "Homebrew" }
  }

  const siteUrl = getServerSiteUrl()
  const url = `${siteUrl}/ttrpg/homebrew/${entry.slug}`
  const plain =
    entry.body_markdown
      ?.replace(/[#*`_\[\]()]/g, " ")
      .slice(0, 160)
      .trim() ?? undefined

  return {
    title: entry.title,
    description: plain,
    openGraph: {
      title: entry.title,
      description: plain,
      type: "article",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: plain,
    },
  }
}

export default async function TtrpgHomebrewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const client = createDirectusServerClient()

  const rows = await client.request(
    readItems("ttrpg_homebrew", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: ["id", "title", "slug", "type", "body_markdown", "campaign_id"],
      limit: 1,
    })
  )
  const entry = rows[0]
  if (!entry) {
    notFound()
  }

  let campaign: { id: string; name: string } | null = null
  if (entry.campaign_id) {
    const cRows = await client.request(
      readItems("campaigns", {
        filter: { id: { _eq: entry.campaign_id } },
        fields: ["id", "name"],
        limit: 1,
      })
    )
    campaign = cRows[0] ?? null
  }

  const { html } = await renderMarkdown(entry.body_markdown ?? "")

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "TTRPG", url: `${siteUrl}/ttrpg` },
    { name: "Homebrew", url: `${siteUrl}/ttrpg?tab=homebrew` },
    {
      name: entry.title,
      url: `${siteUrl}/ttrpg/homebrew/${entry.slug}`,
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
            { label: "Homebrew", href: "/ttrpg?tab=homebrew" },
            { label: entry.title },
          ]}
        />

        <header className="mt-4 mb-8">
          <h1 className="mb-4 font-mono text-3xl font-semibold text-foreground">
            {entry.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {formatHomebrewTypeLabel(entry.type)}
            </Badge>
            {campaign ? (
              <Link
                href={`/ttrpg?tab=homebrew&campaign=${campaign.id}`}
                className="text-primary underline hover:text-foreground"
              >
                {campaign.name}
              </Link>
            ) : (
              <span>System-Agnostic</span>
            )}
          </div>
        </header>

        <div
          className={articleBodyClass}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </article>
    </div>
  )
}
