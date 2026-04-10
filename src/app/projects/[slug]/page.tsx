import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { readItems } from "@directus/sdk"
import { ExternalLink, Github } from "lucide-react"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { createDirectusServerClient } from "@/lib/directus"
import { getAssetUrl } from "@/lib/assets"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass } from "@/lib/utils"

export const revalidate = 3600

type ProjectTagRow = { id: string; name: string }

type ProjectDetail = {
  id: string
  title: string
  slug: string
  description_markdown: string | null
  short_description: string | null
  is_featured: boolean
  role: string | null
  context_constraints: string | null
  outcome_impact: string | null
  thumbnail: string | null
  demo_url: string | null
  repo_url: string | null
  projects_tags?: { tag_id: ProjectTagRow | null }[]
}

export async function generateStaticParams() {
  const client = createDirectusServerClient()
  const projects = await client.request(
    readItems("projects", {
      filter: { status: { _eq: "published" } },
      fields: ["slug"],
    })
  )
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const client = createDirectusServerClient()
  const projects = await client.request(
    readItems("projects", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: ["title", "short_description", "slug"],
      limit: 1,
    })
  )
  const project = projects[0]
  if (!project) {
    return { title: "Project" }
  }

  const siteUrl = getServerSiteUrl()
  const url = `${siteUrl}/projects/${project.slug}`
  const description = project.short_description ?? undefined

  return {
    title: project.title,
    description,
    openGraph: {
      title: project.title,
      description,
      type: "website",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
    },
  }
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const client = createDirectusServerClient()

  const projects = await client.request(
    readItems("projects", {
      filter: { slug: { _eq: slug }, status: { _eq: "published" } },
      fields: [
        "id",
        "title",
        "slug",
        "description_markdown",
        "short_description",
        "is_featured",
        "role",
        "context_constraints",
        "outcome_impact",
        "thumbnail",
        "demo_url",
        "repo_url",
        { projects_tags: [{ tag_id: ["id", "name"] }] },
      ],
      limit: 1,
    } as never)
  )

  const project = (projects as ProjectDetail[])[0]
  if (!project) {
    notFound()
  }

  const { html } = await renderMarkdown(project.description_markdown ?? "")

  const displayTags =
    project.projects_tags?.filter(
      (row): row is { tag_id: ProjectTagRow } => row.tag_id != null
    ) ?? []

  const siteUrl = getServerSiteUrl()
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "Projects", url: `${siteUrl}/projects` },
    { name: project.title, url: `${siteUrl}/projects/${project.slug}` },
  ])

  const linksSection = (
    <div className="mt-8 flex flex-wrap gap-4">
      {project.demo_url && (
        <a
          href={project.demo_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="size-4 shrink-0" />
          Live demo
        </a>
      )}
      {project.repo_url && (
        <a
          href={project.repo_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <Github className="size-4 shrink-0" />
          Source
        </a>
      )}
    </div>
  )

  const tagsSection =
    displayTags.length > 0 ? (
      <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-8">
        {displayTags.map((row) => (
          <span
            key={row.tag_id.id}
            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
          >
            {row.tag_id.name}
          </span>
        ))}
      </div>
    ) : null

  const bodyBlock = (
    <div
      className={articleBodyClass}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <Breadcrumb
          items={[
            { label: "Projects", href: "/projects" },
            { label: project.title },
          ]}
        />

        <article className="mt-8">
          <h1 className="mb-6 font-mono text-3xl font-semibold text-foreground">
            {project.title}
          </h1>

          {project.is_featured ? (
            <>
              {project.role && (
                <section className="mb-8">
                  <h2 className="mb-2 font-mono text-lg font-semibold text-primary">
                    Role
                  </h2>
                  <p className="text-muted-foreground">{project.role}</p>
                </section>
              )}

              {project.context_constraints && (
                <section className="mb-8">
                  <h2 className="mb-2 font-mono text-lg font-semibold text-primary">
                    Context & constraints
                  </h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {project.context_constraints}
                  </p>
                </section>
              )}

              {project.outcome_impact && (
                <section className="mb-8">
                  <h2 className="mb-2 font-mono text-lg font-semibold text-primary">
                    Outcome & impact
                  </h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {project.outcome_impact}
                  </p>
                </section>
              )}

              {bodyBlock}
              {tagsSection}
              {linksSection}

              {project.thumbnail && (
                <div className="relative mt-10 aspect-video w-full max-w-4xl overflow-hidden rounded-lg border border-border">
                  <Image
                    src={getAssetUrl(project.thumbnail)}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
            </>
          ) : (
            <>
              {project.thumbnail && (
                <div className="relative mb-8 aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-border">
                  <Image
                    src={getAssetUrl(project.thumbnail)}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              {bodyBlock}
              {tagsSection}
              {linksSection}
            </>
          )}
        </article>
      </div>
    </>
  )
}
