"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useMemo } from "react"

import { CharacterCard } from "@/components/ttrpg/CharacterCard"
import { HomebrewCard } from "@/components/ttrpg/HomebrewCard"
import { JournalCard } from "@/components/ttrpg/JournalCard"
import { LoreCard } from "@/components/ttrpg/LoreCard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  Campaign,
  TtrpgCharacter,
  TtrpgHomebrew,
  TtrpgJournal,
  TtrpgLore,
} from "@/lib/types/directus"

export type CampaignListRow = Pick<Campaign, "id" | "name" | "slug">

export type JournalListRow = Pick<
  TtrpgJournal,
  | "id"
  | "slug"
  | "title"
  | "session_number"
  | "excerpt"
  | "session_date"
  | "campaign_id"
> & { campaignName: string }

export type CharacterListRow = Pick<
  TtrpgCharacter,
  "id" | "slug" | "name" | "class_role" | "portrait" | "campaign_id"
> & { campaignName: string }

export type LoreListRow = Pick<
  TtrpgLore,
  "id" | "slug" | "title" | "category" | "campaign_id"
> & { campaignName: string }

export type HomebrewListRow = Pick<
  TtrpgHomebrew,
  "id" | "slug" | "title" | "type" | "campaign_id"
> & { campaignName: string }

const TAB_VALUES = ["journals", "characters", "lore", "homebrew"] as const
type TabValue = (typeof TAB_VALUES)[number]

function isTabValue(v: string | null): v is TabValue {
  return v != null && TAB_VALUES.includes(v as TabValue)
}

function buildTtrpgQuery(tab: TabValue, campaign: string) {
  const q = new URLSearchParams()
  if (tab !== "journals") q.set("tab", tab)
  if (campaign !== "all") q.set("campaign", campaign)
  const s = q.toString()
  return s ? `?${s}` : ""
}

function filterByCampaign<T extends { campaign_id: string | null }>(
  items: T[],
  campaignId: string
) {
  if (campaignId === "all") return items
  return items.filter((i) => i.campaign_id === campaignId)
}

export function TtrpgHub({
  journals,
  characters,
  lore,
  homebrew,
  campaigns,
}: {
  journals: JournalListRow[]
  characters: CharacterListRow[]
  lore: LoreListRow[]
  homebrew: HomebrewListRow[]
  campaigns: CampaignListRow[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const tab: TabValue = useMemo(() => {
    const raw = searchParams.get("tab")
    return isTabValue(raw) ? raw : "journals"
  }, [searchParams])

  const campaignParam = searchParams.get("campaign") ?? "all"
  const campaignIds = useMemo(
    () => new Set(campaigns.map((c) => c.id)),
    [campaigns]
  )
  const selectedCampaign =
    campaignParam !== "all" && campaignIds.has(campaignParam)
      ? campaignParam
      : "all"

  const replaceQuery = (nextTab: TabValue, nextCampaign: string) => {
    router.replace(`/ttrpg${buildTtrpgQuery(nextTab, nextCampaign)}`, {
      scroll: false,
    })
  }

  const filteredJournals = filterByCampaign(journals, selectedCampaign)
  const filteredCharacters = filterByCampaign(characters, selectedCampaign)
  const filteredLore = filterByCampaign(lore, selectedCampaign)
  const filteredHomebrew = filterByCampaign(homebrew, selectedCampaign)

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => {
        if (isTabValue(v)) replaceQuery(v, selectedCampaign)
      }}
    >
      <TabsList>
        <TabsTrigger value="journals">Journals</TabsTrigger>
        <TabsTrigger value="characters">Characters</TabsTrigger>
        <TabsTrigger value="lore">Lore</TabsTrigger>
        <TabsTrigger value="homebrew">Homebrew</TabsTrigger>
      </TabsList>

      <div className="mt-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted-foreground">Campaign</span>
        <Select
          value={selectedCampaign}
          onValueChange={(v) => replaceQuery(tab, v)}
        >
          <SelectTrigger className="w-[min(100%,240px)]">
            <SelectValue placeholder="All Campaigns" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TabsContent value="journals" className="mt-0">
        <div className="flex flex-col gap-4">
          {filteredJournals.map((j) => (
            <JournalCard
              key={j.id}
              slug={j.slug}
              title={j.title}
              session_number={j.session_number}
              session_date={j.session_date}
              excerpt={j.excerpt}
              campaignName={j.campaignName}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="characters" className="mt-0">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCharacters.map((c) => (
            <CharacterCard
              key={c.id}
              slug={c.slug}
              name={c.name}
              class_role={c.class_role}
              portrait={c.portrait}
              campaignName={c.campaignName}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="lore" className="mt-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredLore.map((l) => (
            <LoreCard
              key={l.id}
              slug={l.slug}
              title={l.title}
              category={l.category}
              campaignName={l.campaignName}
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="homebrew" className="mt-0">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredHomebrew.map((h) => (
            <HomebrewCard
              key={h.id}
              slug={h.slug}
              title={h.title}
              type={h.type}
              campaignName={h.campaignName}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}
