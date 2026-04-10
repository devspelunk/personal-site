import Link from "next/link"

import { Badge } from "@/components/ui/badge"

import { formatHomebrewTypeLabel } from "./ttrpg-labels"

export function HomebrewCard({
  slug,
  title,
  type,
  campaignName,
}: {
  slug: string
  title: string
  type: string
  campaignName: string
}) {
  return (
    <Link
      href={`/ttrpg/homebrew/${slug}`}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
    >
      <h3 className="mb-3 font-mono text-base font-semibold text-foreground">
        {title}
      </h3>
      <div className="mb-2 flex flex-wrap gap-2">
        <Badge variant="secondary">{formatHomebrewTypeLabel(type)}</Badge>
      </div>
      <p className="text-sm text-green-600 dark:text-green-400">
        {campaignName}
      </p>
    </Link>
  )
}
