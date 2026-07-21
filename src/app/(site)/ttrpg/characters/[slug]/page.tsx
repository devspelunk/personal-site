import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getMediaUrl } from "@/lib/media"
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
    collection: "ttrpg-characters",
    depth: 1,
    where: { slug: { equals: slug } },
    limit: 1,
    ...PUBLIC_READ,
  })
  const character = docs[0]
  if (!character) {
    return { title: "Character" }
  }

  const siteUrl = getServerSiteUrl()
  const url = `${siteUrl}/ttrpg/characters/${character.slug}`
  const description = character.class_role ?? undefined
  const imageUrl = getMediaUrl(character.portrait) ?? `${siteUrl}/og-default.png`

  return {
    title: character.name,
    description,
    openGraph: {
      title: character.name,
      description,
      type: "article",
      url,
      images: [{ url: imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: character.name,
      description,
      images: [imageUrl],
    },
  }
}

export default async function TtrpgCharacterPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const payload = await getPayload()

  const { docs } = await payload.find({
    collection: "ttrpg-characters",
    depth: 1,
    where: { slug: { equals: slug } },
    limit: 1,
    ...PUBLIC_READ,
  })
  const character = docs[0]
  if (!character) {
    notFound()
  }

  const campaign =
    character.campaign && typeof character.campaign === "object"
      ? character.campaign
      : null
  const portraitUrl = getMediaUrl(character.portrait)

  const { html } = await renderMarkdown(character.backstory_markdown ?? "")

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "TTRPG", url: `${siteUrl}/ttrpg` },
    { name: "Characters", url: `${siteUrl}/ttrpg?tab=characters` },
    {
      name: character.name,
      url: `${siteUrl}/ttrpg/characters/${character.slug}`,
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
            { label: "Characters", href: "/ttrpg?tab=characters" },
            { label: character.name },
          ]}
        />

        <div className="mt-6 mb-8 flex flex-col items-start gap-6 sm:flex-row sm:items-start">
          <div className="size-40 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {portraitUrl ? (
              <Image
                src={portraitUrl}
                alt={character.name}
                width={160}
                height={160}
                className="size-full object-cover"
              />
            ) : (
              <div
                className="flex size-full items-center justify-center font-mono text-sm text-muted-foreground"
                aria-hidden
              >
                No portrait
              </div>
            )}
          </div>
          <header className="min-w-0 flex-1">
            <h1 className="mb-2 font-display text-3xl tracking-tight text-foreground uppercase">
              {character.name}
            </h1>
            {character.class_role && (
              <p className="mb-3 text-lg text-purple-600 dark:text-purple-400">
                {character.class_role}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {campaign ? (
                <Link
                  href={`/ttrpg?tab=characters&campaign=${campaign.id}`}
                  className="text-primary underline hover:text-foreground"
                >
                  {campaign.name}
                </Link>
              ) : (
                <span>System-Agnostic</span>
              )}
            </p>
          </header>
        </div>

        {character.stats_overview && (
          <section className="mb-8">
            <h2 className="mb-2 font-mono text-lg font-semibold text-primary">
              Stats
            </h2>
            <pre className="overflow-x-auto rounded-none border border-border bg-muted/50 p-4 font-mono text-sm whitespace-pre-wrap">
              {character.stats_overview}
            </pre>
          </section>
        )}

        <section>
          <h2 className="mb-4 font-mono text-lg font-semibold text-primary">
            Backstory
          </h2>
          <div
            className={articleBodyClass}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </section>
      </article>
    </div>
  )
}
