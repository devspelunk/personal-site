import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { readItems, readSingleton } from "@directus/sdk"
import { Circle, Github, Linkedin, Mail, X } from "lucide-react"

import { CareerHighlights } from "@/components/homepage/CareerHighlights"
import { SectionHeading } from "@/components/homepage/SectionHeading"
import { Testimonials } from "@/components/homepage/Testimonials"
import { Button } from "@/components/ui/button"
import { createDirectusServerClient } from "@/lib/directus"
import { getAssetUrl } from "@/lib/assets"
import { buildBreadcrumbJsonLd, jsonLdScriptHtml } from "@/lib/jsonld"
import { renderMarkdown } from "@/lib/markdown"
import { getServerSiteUrl } from "@/lib/site-url"
import type {
  CareerEntry,
  SiteSettings,
  Testimonial,
} from "@/lib/types/directus"
import { articleBodyClass } from "@/lib/utils"

export const revalidate = 3600

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null

const isSiteSettings = (value: unknown): value is SiteSettings => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.bio_markdown === "string" ||
    value.bio_markdown === null ||
    value.bio_markdown === undefined
  )
}

const isCareerEntry = (value: unknown): value is CareerEntry => {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === "string" &&
    typeof value.role === "string" &&
    typeof value.company === "string" &&
    typeof value.date_start === "string"
  )
}

const isTestimonial = (value: unknown): value is Testimonial => {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === "string" && typeof value.quote === "string"
}

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
  const client = createDirectusServerClient()

  let rawSiteSettings: unknown
  let rawCareerEntries: unknown
  let rawTestimonials: unknown

  try {
    ;[rawSiteSettings, rawCareerEntries, rawTestimonials] = await Promise.all([
      client.request(readSingleton("site_settings")),
      client.request(
        readItems("career_entries", {
          sort: ["sort_order"],
        })
      ),
      client.request(
        readItems("testimonials", {
          sort: ["sort_order"],
        })
      ),
    ])
  } catch (error) {
    console.error("[AboutPage] Directus fetch failed", error)
    notFound()
  }

  if (!isSiteSettings(rawSiteSettings)) {
    console.error("[AboutPage] Invalid site_settings response shape")
    notFound()
  }

  const settings = rawSiteSettings

  const entries = Array.isArray(rawCareerEntries)
    ? rawCareerEntries.filter(isCareerEntry)
    : []

  if (!Array.isArray(rawCareerEntries)) {
    console.error("[AboutPage] Invalid career_entries response shape")
  }

  const testimonialRows = Array.isArray(rawTestimonials)
    ? rawTestimonials.filter(isTestimonial)
    : []

  if (!Array.isArray(rawTestimonials)) {
    console.error("[AboutPage] Invalid testimonials response shape")
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
          {settings.avatar && (
            <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-full border border-border md:mx-0">
              <Image
                src={getAssetUrl(settings.avatar)}
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

      {settings.resume_pdf && (
        <section className="border-b border-border py-12">
          <h2 className="mb-4 font-mono text-lg text-primary">Resume</h2>
          <Button variant="outline" asChild>
            <a
              href={getAssetUrl(settings.resume_pdf)}
              download
              target="_blank"
              rel="noreferrer"
            >
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
