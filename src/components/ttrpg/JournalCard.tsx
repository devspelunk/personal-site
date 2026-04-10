import Link from "next/link"

import { formatDate } from "@/lib/utils"

export function JournalCard({
  slug,
  title,
  session_number,
  session_date,
  excerpt,
  campaignName,
}: {
  slug: string
  title: string
  session_number: number | null
  session_date: string | null
  excerpt: string | null
  campaignName: string
}) {
  const heading =
    session_number != null ? `Session ${session_number}: ${title}` : title

  return (
    <Link
      href={`/ttrpg/journals/${slug}`}
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
    >
      <h3 className="mb-2 font-mono text-base font-semibold text-foreground">
        {heading}
      </h3>
      <p className="mb-2 text-sm text-green-600 dark:text-green-400">
        {campaignName}
      </p>
      {session_date && (
        <p className="mb-3 text-xs text-muted-foreground">
          {formatDate(session_date)}
        </p>
      )}
      {excerpt && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{excerpt}</p>
      )}
    </Link>
  )
}
