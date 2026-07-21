import type { Metadata } from "next"

import {
  ProjectCardsGrid,
  type ProjectCardData,
} from "@/components/projects/ProjectCard"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { getMediaUrl } from "@/lib/media"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import type { Project, Tag } from "@/payload-types"

export const revalidate = 3600

const projectsDescription =
  "Selected work across product engineering, architecture, and full-stack delivery."

export const metadata: Metadata = {
  title: "Projects",
  description: projectsDescription,
  openGraph: {
    title: "Projects",
    description: projectsDescription,
    url: "/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects",
    description: projectsDescription,
  },
}

function toCardData(project: Project): ProjectCardData {
  const tags = (project.tags ?? [])
    .filter((tag): tag is Tag => typeof tag === "object" && tag !== null)
    .map((tag) => ({ id: tag.id, name: tag.name }))

  return {
    slug: project.slug,
    title: project.title,
    short_description: project.short_description ?? null,
    thumbnail: getMediaUrl(project.thumbnail) ?? null,
    tags,
  }
}

export default async function ProjectsPage() {
  const payload = await getPayload()

  let docs: Project[] = []
  try {
    // overrideAccess: false enforces published-only for anonymous reads.
    const result = await payload.find({
      collection: "projects",
      depth: 1,
      overrideAccess: false,
      sort: "sort_order",
      limit: 100,
    })
    docs = result.docs
  } catch (error) {
    console.error("[ProjectsPage] payload.find projects (published list) failed", error)
  }

  const featuredProjects = docs.filter((p) => p.is_featured).map(toCardData)
  const smallerProjects = docs.filter((p) => !p.is_featured).map(toCardData)

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "Projects", url: `${siteUrl}/projects` },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />
      <SectionHeading command="$ ls ~/projects" variant="page" />

      {featuredProjects.length > 0 && (
        <section className="mt-2">
          <ProjectCardsGrid projects={featuredProjects} featured />
        </section>
      )}

      {smallerProjects.length > 0 && (
        <section className={featuredProjects.length > 0 ? "mt-12" : "mt-2"}>
          <ProjectCardsGrid projects={smallerProjects} featured={false} />
        </section>
      )}

      {featuredProjects.length === 0 && smallerProjects.length === 0 && (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      )}
    </div>
  )
}
