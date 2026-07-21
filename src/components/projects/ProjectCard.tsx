"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

import { staggerChildren, staggerItem } from "@/lib/animations"
import { cn } from "@/lib/utils"
import { DataStrip, formatDataStripCode } from "@/components/ornament/DataStrip"
import { GlitchCard } from "@/components/ornament/Glitch"

export type ProjectCardTag = { id: number; name: string }

export type ProjectCardData = {
  slug: string
  title: string
  short_description: string | null
  /** Same-origin media URL resolved via `getMediaUrl`, or null when absent. */
  thumbnail: string | null
  tags: ProjectCardTag[]
}

export function ProjectCard({
  slug,
  title,
  short_description,
  thumbnail,
  tags,
  featured = false,
  index,
}: ProjectCardData & { featured?: boolean; index?: number }) {
  const code = formatDataStripCode("PROJ", index ?? slug)

  return (
    <motion.div variants={staggerItem}>
      <GlitchCard>
        <Link
          href={`/projects/${slug}`}
          className="block h-full rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
        >
          {thumbnail && (
            <div
              className={cn(
                "relative mb-4 w-full overflow-hidden rounded-md",
                featured ? "aspect-video" : "h-32"
              )}
            >
              <Image src={thumbnail} alt={title} fill className="object-cover" />
            </div>
          )}

          <h3
            className={cn(
              "mb-2 font-mono font-semibold text-foreground",
              featured ? "text-lg" : "text-base"
            )}
          >
            {title}
          </h3>

          {short_description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {short_description}
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
    </motion.div>
  )
}

export function ProjectCardsGrid({
  projects,
  featured,
}: {
  projects: ProjectCardData[]
  featured: boolean
}) {
  const gridClass = featured
    ? "grid grid-cols-1 gap-4 lg:grid-cols-2"
    : "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"

  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className={gridClass}
    >
      {projects.map((project, i) => (
        <ProjectCard
          key={project.slug}
          {...project}
          featured={featured}
          index={i}
        />
      ))}
    </motion.div>
  )
}
