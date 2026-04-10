import type { Metadata } from "next"
import { readItems } from "@directus/sdk"

import {
  ProjectCardsGrid,
  type ProjectCardData,
} from "@/components/projects/ProjectCard"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { createDirectusServerClient } from "@/lib/directus"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { getServerSiteUrl } from "@/lib/site-url"

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

type ProjectListRow = {
  id: string
  slug: string
  title: string
  short_description: string | null
  is_featured: boolean
  thumbnail: string | null
  projects_tags?: { tag_id: { id: string; name: string } | null }[]
}

function toCardData(row: ProjectListRow): ProjectCardData {
  const tags =
    row.projects_tags
      ?.map((r) => r.tag_id)
      .filter((t): t is { id: string; name: string } => t != null) ?? []

  return {
    slug: row.slug,
    title: row.title,
    short_description: row.short_description,
    thumbnail: row.thumbnail,
    tags,
  }
}

export default async function ProjectsPage() {
  const client = createDirectusServerClient()

  let rawProjects: ProjectListRow[] = []
  try {
    rawProjects = (await client.request(
      readItems("projects", {
        filter: { status: { _eq: "published" } },
        sort: ["sort_order"],
        fields: [
          "id",
          "slug",
          "title",
          "short_description",
          "is_featured",
          "thumbnail",
          { projects_tags: [{ tag_id: ["id", "name"] }] },
        ],
      } as never)
    )) as ProjectListRow[]
  } catch (error) {
    console.error(
      "[ProjectsPage] readItems projects (published list) failed",
      error
    )
  }

  const featuredProjects = rawProjects
    .filter((p) => p.is_featured)
    .map(toCardData)
  const smallerProjects = rawProjects
    .filter((p) => !p.is_featured)
    .map(toCardData)

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
