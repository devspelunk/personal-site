import type { Metadata } from "next"
import { Suspense } from "react"

import { SectionHeading } from "@/components/homepage/SectionHeading"
import {
  type CampaignListRow,
  type CharacterListRow,
  type HomebrewListRow,
  type JournalListRow,
  type LoreListRow,
  TtrpgHub,
} from "@/components/ttrpg/TtrpgHub"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { getMediaUrl } from "@/lib/media"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import type { Campaign } from "@/payload-types"

export const revalidate = 3600

// These pages read as an anonymous visitor. Passing `overrideAccess: false`
// makes Payload run the collections' `authenticatedOrPublished` read access,
// which constrains results to `_status: published` — so drafts never leak.
const PUBLIC_READ = { overrideAccess: false } as const

const ttrpgDescription =
  "Session journals, characters, lore, and homebrew content from tabletop campaigns."

export const metadata: Metadata = {
  title: "TTRPG",
  description: ttrpgDescription,
  openGraph: {
    title: "TTRPG",
    description: ttrpgDescription,
    url: "/ttrpg",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TTRPG",
    description: ttrpgDescription,
  },
}

/**
 * Resolve the campaign relationship populated at `depth: 1`. Returns the
 * campaign id (for tab/campaign filtering) and a display name, falling back to
 * "System-Agnostic" when the relation is empty.
 */
function resolveCampaign(
  campaign: (number | null) | Campaign | undefined
): { campaignId: number | null; campaignName: string } {
  if (campaign && typeof campaign === "object") {
    return { campaignId: campaign.id, campaignName: campaign.name }
  }
  return { campaignId: null, campaignName: "System-Agnostic" }
}

export default async function TtrpgPage() {
  const payload = await getPayload()

  let campaigns: CampaignListRow[] = []
  let journals: JournalListRow[] = []
  let characters: CharacterListRow[] = []
  let lore: LoreListRow[] = []
  let homebrew: HomebrewListRow[] = []

  try {
    const [campaignsRes, journalsRes, charactersRes, loreRes, homebrewRes] =
      await Promise.all([
        payload.find({
          collection: "campaigns",
          depth: 0,
          limit: 0,
          sort: "name",
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-journals",
          depth: 1,
          limit: 0,
          sort: "-session_date",
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-characters",
          depth: 1,
          limit: 0,
          sort: "name",
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-lore",
          depth: 1,
          limit: 0,
          sort: "title",
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "ttrpg-homebrew",
          depth: 1,
          limit: 0,
          sort: "title",
          ...PUBLIC_READ,
        }),
      ])

    campaigns = campaignsRes.docs.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }))
    journals = journalsRes.docs.map((j) => ({
      id: j.id,
      slug: j.slug,
      title: j.title,
      session_number: j.session_number,
      excerpt: j.excerpt,
      session_date: j.session_date,
      ...resolveCampaign(j.campaign),
    }))
    characters = charactersRes.docs.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      class_role: c.class_role,
      portraitUrl: getMediaUrl(c.portrait),
      ...resolveCampaign(c.campaign),
    }))
    lore = loreRes.docs.map((l) => ({
      id: l.id,
      slug: l.slug,
      title: l.title,
      category: l.category,
      ...resolveCampaign(l.campaign),
    }))
    homebrew = homebrewRes.docs.map((h) => ({
      id: h.id,
      slug: h.slug,
      title: h.title,
      type: h.type,
      ...resolveCampaign(h.campaign),
    }))
  } catch (error) {
    console.error("[TtrpgPage] payload.find failed", error)
  }

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "TTRPG", url: `${siteUrl}/ttrpg` },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />
      <SectionHeading command="$ cd ~/campaigns" variant="page" />
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <TtrpgHub
          journals={journals}
          characters={characters}
          lore={lore}
          homebrew={homebrew}
          campaigns={campaigns}
        />
      </Suspense>
    </div>
  )
}
