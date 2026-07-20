import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { readItems } from "@directus/sdk"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { getAssetUrl } from "@/lib/assets"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass } from "@/lib/utils"

export const revalidate = 3600

export async function generateStaticParams() {
  const client = createDirectusServerClient()
  const rows = await client.request(
    readItems("ttrpg_characters", {
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
    readItems("ttrpg_characters", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: ["name", "slug", "class_role", "portrait"],
      limit: 1,
    })
  )
  const character = rows[0]
  if (!character) {
    return { title: "Character" }
  }

  const siteUrl = getServerSiteUrl()
  const url = `${siteUrl}/ttrpg/characters/${character.slug}`
  const description = character.class_role ?? undefined
  const imageUrl = character.portrait
    ? getAssetUrl(character.portrait)
    : `${siteUrl}/og-default.png`

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
  const client = createDirectusServerClient()

  const rows = await client.request(
    readItems("ttrpg_characters", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: [
        "id",
        "name",
        "slug",
        "class_role",
        "portrait",
        "stats_overview",
        "backstory_markdown",
        "campaign_id",
      ],
      limit: 1,
    })
  )
  const character = rows[0]
  if (!character) {
    notFound()
  }

  let campaign: { id: string; name: string } | null = null
  if (character.campaign_id) {
    const cRows = await client.request(
      readItems("campaigns", {
        filter: { id: { _eq: character.campaign_id } },
        fields: ["id", "name"],
        limit: 1,
      })
    )
    campaign = cRows[0] ?? null
  }

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
            {character.portrait ? (
              <Image
                src={getAssetUrl(character.portrait)}
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
            <h1 className="mb-2 font-mono text-3xl font-semibold text-foreground">
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
            <pre className="overflow-x-auto rounded-lg border border-border bg-muted/50 p-4 font-mono text-sm whitespace-pre-wrap">
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
