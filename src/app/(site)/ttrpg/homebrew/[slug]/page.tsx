import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { formatHomebrewTypeLabel } from "@/components/ttrpg/ttrpg-labels"
import { Badge } from "@/components/ui/badge"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass } from "@/lib/utils"

export const revalidate = 3600

// Read as an anonymous visitor so the `authenticatedOrPublished` access control
// constrains results to `_status: published` (drafts never leak).
const PUBLIC_READ = { overrideAccess: false } as const

export function generateStaticParams(): { slug: string }[] {
  // Defer slug generation to on-demand ISR so the production image build needs
  // no live database. Default `dynamicParams` renders + caches each path on
  // first request; `revalidate: 3600` keeps it fresh.
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: "ttrpg-homebrew",
    depth: 0,
    where: { slug: { equals: slug } },
    limit: 1,
    ...PUBLIC_READ,
  })
  const entry = docs[0]
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
  const payload = await getPayload()

  const { docs } = await payload.find({
    collection: "ttrpg-homebrew",
    depth: 1,
    where: { slug: { equals: slug } },
    limit: 1,
    ...PUBLIC_READ,
  })
  const entry = docs[0]
  if (!entry) {
    notFound()
  }

  const campaign =
    entry.campaign && typeof entry.campaign === "object" ? entry.campaign : null

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
