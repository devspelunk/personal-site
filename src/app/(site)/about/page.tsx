import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Circle, Github, Linkedin, Mail, X } from "lucide-react"

import { CareerHighlights } from "@/components/homepage/CareerHighlights"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { Testimonials } from "@/components/homepage/Testimonials"
import { Button } from "@/components/ui/button"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getMediaUrl } from "@/lib/media"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import type { CareerEntry, SiteSetting, Testimonial } from "@/payload-types"
import { articleBodyClass } from "@/lib/utils"

export const revalidate = 3600

// Anonymous reads: `overrideAccess: false` keeps public reads consistent with
// the drafted collections elsewhere (career/testimonials/site-settings are not
// drafted, so this is a harmless no-op for them).
const PUBLIC_READ = { overrideAccess: false } as const

const aboutDescription =
  "Background, experience, testimonials, and how to get in touch."

export const metadata: Metadata = {
  title: "About",
  description: aboutDescription,
  openGraph: {
    title: "About",
    description: aboutDescription,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About",
    description: aboutDescription,
  },
}

export default async function AboutPage() {
  const payload = await getPayload()

  let settings: SiteSetting
  let entries: CareerEntry[] = []
  let testimonialRows: Testimonial[] = []

  try {
    const [settingsRes, careerRes, testimonialsRes] = await Promise.all([
      // depth 1 populates avatar + resume_pdf uploads.
      payload.findGlobal({ slug: "site-settings", depth: 1, ...PUBLIC_READ }),
      payload.find({
        collection: "career-entries",
        depth: 0,
        sort: "sort_order",
        limit: 0,
        ...PUBLIC_READ,
      }),
      payload.find({
        collection: "testimonials",
        depth: 1,
        sort: "sort_order",
        limit: 0,
        ...PUBLIC_READ,
      }),
    ])
    settings = settingsRes
    entries = careerRes.docs
    testimonialRows = testimonialsRes.docs
  } catch (error) {
    console.error("[AboutPage] payload fetch failed", error)
    notFound()
  }

  const { html: bioHtml } = await renderMarkdown(settings.bio_markdown ?? "")

  const careerEntriesForAbout = await Promise.all(
    entries.map(async (entry) => {
      const md = entry.description_markdown?.trim()
      if (!md) {
        return { ...entry }
      }
      const { html } = await renderMarkdown(md)
      return { ...entry, descriptionHtml: html }
    })
  )

  const avatarUrl = getMediaUrl(settings.avatar)
  const resumeUrl = getMediaUrl(settings.resume_pdf)

  const siteUrl = getServerSiteUrl()
  const displayName = settings.full_name ?? "Michael Lemus"
  const sameAs = [
    settings.linkedin_url,
    settings.github_username
      ? `https://github.com/${settings.github_username}`
      : null,
    settings.twitter_url,
    settings.bluesky_handle
      ? `https://bsky.app/profile/${settings.bluesky_handle}`
      : null,
  ].filter((url): url is string => Boolean(url))

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: siteUrl,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", url: `${siteUrl}/` },
    { name: "About", url: `${siteUrl}/about` },
  ])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(breadcrumbLd) }}
      />

      <SectionHeading command="$ cat ~/about.md" variant="page" />

      <section className="mt-8 border-b border-border pb-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          {avatarUrl && (
            <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-full border border-border md:mx-0">
              <Image
                src={avatarUrl}
                alt={displayName}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="mb-4 font-mono text-2xl font-semibold text-foreground">
              {displayName}
            </h2>
            <div
              className={articleBodyClass}
              dangerouslySetInnerHTML={{ __html: bioHtml }}
            />
          </div>
        </div>
      </section>

      {entries.length > 0 && (
        <section className="border-b border-border py-12">
          <CareerHighlights
            entries={careerEntriesForAbout}
            showViewAll={false}
            command="$ cat career.json"
            variant="about"
          />
        </section>
      )}

      {testimonialRows.length > 0 && (
        <section className="border-b border-border py-12">
          <Testimonials testimonials={testimonialRows} />
        </section>
      )}

      {resumeUrl && (
        <section className="border-b border-border py-12">
          <h2 className="mb-4 font-mono text-lg text-primary">Resume</h2>
          <Button variant="outline" asChild>
            <a href={resumeUrl} download target="_blank" rel="noreferrer">
              Download resume
            </a>
          </Button>
        </section>
      )}

      {(settings.linkedin_url ||
        settings.github_username ||
        settings.twitter_url ||
        settings.bluesky_handle ||
        settings.email) && (
        <section className="py-12">
          <h2 className="mb-4 font-mono text-lg text-primary">Connect</h2>
          <div className="flex flex-wrap gap-4">
            {settings.linkedin_url && (
              <a
                href={settings.linkedin_url}
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn profile"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Linkedin className="size-5" />
              </a>
            )}
            {settings.github_username && (
              <a
                href={`https://github.com/${settings.github_username}`}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub profile"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="size-5" />
              </a>
            )}
            {settings.twitter_url && (
              <a
                href={settings.twitter_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter profile"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-5" />
              </a>
            )}
            {settings.bluesky_handle && (
              <a
                href={`https://bsky.app/profile/${settings.bluesky_handle}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Bluesky profile"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Circle className="size-5" />
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                aria-label="Email"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-5" />
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
