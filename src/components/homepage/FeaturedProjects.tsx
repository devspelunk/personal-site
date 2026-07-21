"use client"

import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

import { staggerChildren, staggerItem } from "@/lib/animations"
import { DataStrip, formatDataStripCode } from "@/components/ornament/DataStrip"
import { GlitchCard } from "@/components/ornament/Glitch"

import { SectionHeading } from "./SectionHeading"

interface ProjectPreview {
  id: number
  slug: string
  title: string
  short_description: string | null
  /** Same-origin media URL resolved via `getMediaUrl`, or null when absent. */
  thumbnail: string | null
  tags: { id: number; name: string }[]
}

export const FeaturedProjects = ({
  projects,
}: {
  projects: ProjectPreview[]
}) => (
  <div>
    <SectionHeading command="$ ls ~/projects --featured" />

    <motion.div
      variants={staggerChildren}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {projects.map((project, i) => (
        <motion.div key={project.id} variants={staggerItem}>
          <GlitchCard>
            <Link
              href={`/projects/${project.slug}`}
              className="block h-full rounded-none border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              {project.thumbnail && (
                <div className="relative mb-4 aspect-video overflow-hidden rounded-none">
                  <Image
                    src={project.thumbnail}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <h3 className="mb-2 font-mono text-base font-semibold text-foreground">
                {project.title}
              </h3>

              {project.short_description && (
                <p className="mb-3 text-sm text-muted-foreground">
                  {project.short_description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>

              <DataStrip
                code={formatDataStripCode("PROJ", i)}
                items={[project.slug]}
                className="mt-4 border-t border-border pt-3"
              />
            </Link>
          </GlitchCard>
        </motion.div>
      ))}
    </motion.div>

    <div className="mt-4">
      <Link href="/projects" className="text-sm text-primary hover:underline">
        View all projects →
      </Link>
    </div>
  </div>
)
