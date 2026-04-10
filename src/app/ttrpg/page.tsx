import type { Metadata } from "next"
import { Suspense } from "react"
import { readItems } from "@directus/sdk"

import { SectionHeading } from "@/components/homepage/SectionHeading"
import {
  type CampaignListRow,
  type CharacterListRow,
  type HomebrewListRow,
  type JournalListRow,
  type LoreListRow,
  TtrpgHub,
} from "@/components/ttrpg/TtrpgHub"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { getServerSiteUrl } from "@/lib/site-url"
import type {
  TtrpgCharacter,
  TtrpgHomebrew,
  TtrpgJournal,
  TtrpgLore,
} from "@/lib/types/directus"

export const revalidate = 3600

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

type JournalRow = Pick<
  TtrpgJournal,
  | "id"
  | "slug"
  | "title"
  | "session_number"
  | "excerpt"
  | "session_date"
  | "campaign_id"
>
type CharacterRow = Pick<
  TtrpgCharacter,
  "id" | "slug" | "name" | "class_role" | "portrait" | "campaign_id"
>
type LoreRow = Pick<
  TtrpgLore,
  "id" | "slug" | "title" | "category" | "campaign_id"
>
type HomebrewRow = Pick<
  TtrpgHomebrew,
  "id" | "slug" | "title" | "type" | "campaign_id"
>

function resolveCampaignName(
  campaignMap: Map<string, string>,
  campaignId: string | null
) {
  if (campaignId == null) return "System-Agnostic"
  return campaignMap.get(campaignId) ?? "Unknown campaign"
}

export default async function TtrpgPage() {
  const client = createDirectusServerClient()

  let campaigns: CampaignListRow[] = []
  let journals: JournalRow[] = []
  let characters: CharacterRow[] = []
  let lore: LoreRow[] = []
  let homebrew: HomebrewRow[] = []

  try {
    ;[campaigns, journals, characters, lore, homebrew] = (await Promise.all([
      client.request(
        readItems("campaigns", {
          fields: ["id", "name", "slug"],
        })
      ),
      client.request(
        readItems("ttrpg_journals", {
          filter: { status: { _eq: "published" } },
          sort: ["-session_date"],
          fields: [
            "id",
            "slug",
            "title",
            "session_number",
            "excerpt",
            "session_date",
            "campaign_id",
          ],
        })
      ),
      client.request(
        readItems("ttrpg_characters", {
          filter: { status: { _eq: "published" } },
          fields: [
            "id",
            "slug",
            "name",
            "class_role",
            "portrait",
            "campaign_id",
          ],
        })
      ),
      client.request(
        readItems("ttrpg_lore", {
          filter: { status: { _eq: "published" } },
          fields: ["id", "slug", "title", "category", "campaign_id"],
        })
      ),
      client.request(
        readItems("ttrpg_homebrew", {
          filter: { status: { _eq: "published" } },
          fields: ["id", "slug", "title", "type", "campaign_id"],
        })
      ),
    ])) as [
      CampaignListRow[],
      JournalRow[],
      CharacterRow[],
      LoreRow[],
      HomebrewRow[],
    ]
  } catch (error) {
    console.error("[TtrpgPage] readItems failed", error)
  }

  const campaignMap = new Map<string, string>(
    campaigns.map((c) => [c.id, c.name])
  )

  const journalsWithName: JournalListRow[] = journals.map((j) => ({
    ...j,
    campaignName: resolveCampaignName(campaignMap, j.campaign_id),
  }))
  const charactersWithName: CharacterListRow[] = characters.map((c) => ({
    ...c,
    campaignName: resolveCampaignName(campaignMap, c.campaign_id),
  }))
  const loreWithName: LoreListRow[] = lore.map((l) => ({
    ...l,
    campaignName: resolveCampaignName(campaignMap, l.campaign_id),
  }))
  const homebrewWithName: HomebrewListRow[] = homebrew.map((h) => ({
    ...h,
    campaignName: resolveCampaignName(campaignMap, h.campaign_id),
  }))

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
          journals={journalsWithName}
          characters={charactersWithName}
          lore={loreWithName}
          homebrew={homebrewWithName}
          campaigns={campaigns}
        />
      </Suspense>
    </div>
  )
}
