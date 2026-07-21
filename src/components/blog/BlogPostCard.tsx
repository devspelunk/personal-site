import Link from "next/link"

import { formatDate } from "@/lib/utils"
import { DataStrip, formatDataStripCode } from "@/components/ornament/DataStrip"
import { GlitchCard } from "@/components/ornament/Glitch"

export interface BlogPostCardTag {
  id: number
  name: string
  slug: string
}

export function BlogPostCard({
  slug,
  title,
  excerpt,
  date_published,
  readTime,
  tags,
  index,
}: {
  slug: string
  title: string
  excerpt: string | null
  date_published: string | null
  readTime: number | null
  tags: BlogPostCardTag[]
  /** List position, used only for the decorative DataStrip index code. */
  index?: number
}) {
  const metaParts: string[] = []
  if (date_published) metaParts.push(formatDate(date_published))
  if (readTime != null) metaParts.push(`${readTime} min read`)
  const metaLine = metaParts.join(" · ")

  const code = formatDataStripCode("BLOG", index ?? slug)

  return (
    <GlitchCard>
      <Link
        href={`/blog/${slug}`}
        className="block h-full rounded-none border border-border bg-card p-5 transition-colors hover:border-primary"
      >
        <h3 className="mb-2 font-mono text-base font-semibold text-foreground">
          {title}
        </h3>

        {metaLine && (
          <p className="mb-3 text-xs text-muted-foreground">{metaLine}</p>
        )}

        {excerpt && (
          <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
            {excerpt}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <DataStrip
          code={code}
          items={[slug]}
          className="mt-4 border-t border-border pt-3"
        />
      </Link>
    </GlitchCard>
  )
}
