import type { Metadata } from "next"
import Script from "next/script"
import { readItems, readSingleton } from "@directus/sdk"

import "./globals.css"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { CommandPalette } from "@/components/CommandPalette"
import { CommandPaletteProvider } from "@/components/CommandPaletteContext"
import { Terminal } from "@/components/Terminal"
import { TerminalProvider } from "@/components/TerminalContext"
import { createDirectusServerClient, getAssetUrl } from "@/lib/directus"
import type { SiteSettings } from "@/lib/types/directus"

const FALLBACK_SITE_SETTINGS: SiteSettings = {
  id: "",
  full_name: null,
  role: null,
  tagline: null,
  bio_markdown: null,
  avatar: null,
  resume_pdf: null,
  github_username: null,
  linkedin_url: null,
  twitter_url: null,
  bluesky_handle: null,
  email: null,
}

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "Michael Lemus",
    template: "%s | Michael Lemus",
  },
  description:
    "Software engineer portfolio, projects, writing, and TTRPG notes by Michael Lemus.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    images: ["/og-default.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
}

type TerminalProject = { title: string; slug: string }
type TerminalBlogPost = { title: string; slug: string }
type TerminalCareerEntry = {
  role: string
  company: string
  date_start: string
  date_end: string | null
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let siteSettings: SiteSettings
  let projects: TerminalProject[] = []
  let blogPosts: TerminalBlogPost[] = []
  let careerEntries: TerminalCareerEntry[] = []

  try {
    const client = createDirectusServerClient()
    ;[siteSettings, projects, blogPosts, careerEntries] = (await Promise.all([
      client.request(readSingleton("site_settings")),
      client.request(
        readItems("projects", {
          filter: { status: { _eq: "published" } },
          sort: ["sort_order"],
          fields: ["title", "slug"],
        } as never)
      ),
      client.request(
        readItems("blog_posts", {
          filter: { status: { _eq: "published" } },
          sort: ["-date_published"],
          fields: ["title", "slug"],
        } as never)
      ),
      client.request(
        readItems("career_entries", {
          sort: ["sort_order"],
          fields: ["role", "company", "date_start", "date_end"],
        } as never)
      ),
    ])) as [
      SiteSettings,
      TerminalProject[],
      TerminalBlogPost[],
      TerminalCareerEntry[],
    ]
  } catch (error) {
    console.error("[RootLayout] Directus fetch failed:", error)
    siteSettings = FALLBACK_SITE_SETTINGS
  }

  const social = {
    linkedinUrl: siteSettings.linkedin_url ?? undefined,
    githubUrl: siteSettings.github_username
      ? `https://github.com/${siteSettings.github_username}`
      : undefined,
    twitterUrl: siteSettings.twitter_url ?? undefined,
    blueskyUrl: siteSettings.bluesky_handle
      ? `https://bsky.app/profile/${siteSettings.bluesky_handle}`
      : undefined,
    email: siteSettings.email ?? undefined,
  }

  const resumePdfUrl = siteSettings.resume_pdf
    ? getAssetUrl(siteSettings.resume_pdf)
    : undefined

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_URL

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {umamiId && umamiSrc ? (
          <Script
            src={umamiSrc}
            strategy="afterInteractive"
            data-website-id={umamiId}
            data-do-not-track="true"
          />
        ) : null}
        <CommandPaletteProvider>
          <TerminalProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar social={social} />
              <main className="flex-1">{children}</main>
              <Footer social={social} resumePdfUrl={resumePdfUrl} />
              <CommandPalette />
              <Terminal
                fullName={siteSettings.full_name}
                tagline={siteSettings.tagline}
                projects={projects}
                blogPosts={blogPosts}
                careerEntries={careerEntries}
                resumeUrl={resumePdfUrl ?? null}
              />
            </div>
          </TerminalProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
