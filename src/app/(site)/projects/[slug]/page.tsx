import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ExternalLink, Github } from "lucide-react"

import { Breadcrumb } from "@/components/blog/Breadcrumb"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getMediaUrl } from "@/lib/media"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import { articleBodyClass } from "@/lib/utils"
import { DataStrip, formatDataStripCode } from "@/components/ornament/DataStrip"
import { GlitchText } from "@/components/ornament/Glitch"
import type { Project, Tag } from "@/payload-types"

export const revalidate = 3600

/** Keep only the tag relations Payload populated at depth >= 1. */
function resolveTags(tags: Project["tags"]): Tag[] {
  return (tags ?? []).filter(
    (tag): tag is Tag => typeof tag === "object" && tag !== null
  )
}

export function generateStaticParams(): { slug: string }[] {
  // Defer slug generation to on-demand ISR so the production image build needs
  // no live database. Default `dynamicParams` renders + caches each path on
  // first request; `revalidate: 3600` keeps it fresh.
  return []
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload()
  const result = await payload.find({
    collection: "projects",
    depth: 0,
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const project = result.docs[0]
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
  const payload = await getPayload()

  const result = await payload.find({
    collection: "projects",
    depth: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
    limit: 1,
  })

  const project = result.docs[0]
  if (!project) {
    notFound()
  }

  const { html } = await renderMarkdown(project.description_markdown ?? "")

  const displayTags = resolveTags(project.tags)
  const thumbnailUrl = getMediaUrl(project.thumbnail)

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
        {displayTags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
          >
            {tag.name}
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
          <DataStrip
            code={formatDataStripCode("PROJ", project.slug)}
            items={[project.slug]}
            className="mb-4"
          />
          <GlitchText
            as="h1"
            className="mb-6 font-display text-3xl tracking-tight text-foreground uppercase"
          >
            {project.title}
          </GlitchText>

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

              {thumbnailUrl && (
                <div className="relative mt-10 aspect-video w-full max-w-4xl overflow-hidden rounded-lg border border-border">
                  <Image
                    src={thumbnailUrl}
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
              {thumbnailUrl && (
                <div className="relative mb-8 aspect-video w-full max-w-3xl overflow-hidden rounded-lg border border-border">
                  <Image
                    src={thumbnailUrl}
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
