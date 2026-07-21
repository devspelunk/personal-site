import type { Metadata } from "next"
import { JetBrains_Mono, Michroma } from "next/font/google"
import Script from "next/script"

import "./globals.css"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
import { CommandPalette } from "@/components/CommandPalette"
import { CommandPaletteProvider } from "@/components/CommandPaletteContext"
import { Terminal } from "@/components/Terminal"
import { TerminalProvider } from "@/components/TerminalContext"
import { getMediaUrl } from "@/lib/media"
import { getPayload } from "@/lib/payload"
import type { SiteSetting } from "@/payload-types"

// Body voice: JetBrains Mono. Exposed as the `--font-jetbrains-mono` CSS
// variable consumed by the `--font-mono`/`--font-sans` tokens in globals.css.
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

// Display voice: Michroma (wide, technical) for headings/hero. Single 400
// weight. Exposed as `--font-michroma`, consumed by the `--font-display` token.
const michroma = Michroma({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-michroma",
})

// Anonymous reads: `overrideAccess: false` runs each collection's
// `authenticatedOrPublished` access, constraining drafted collections
// (projects, blog-posts) to published docs.
const PUBLIC_READ = { overrideAccess: false } as const

const FALLBACK_SITE_SETTINGS: SiteSetting = {
  id: 0,
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
  let siteSettings: SiteSetting
  let projects: TerminalProject[] = []
  let blogPosts: TerminalBlogPost[] = []
  let careerEntries: TerminalCareerEntry[] = []

  try {
    const payload = await getPayload()
    const [settingsRes, projectsRes, blogPostsRes, careerRes] =
      await Promise.all([
        // depth 1 populates the resume_pdf upload so the footer link resolves.
        payload.findGlobal({
          slug: "site-settings",
          depth: 1,
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "projects",
          depth: 0,
          limit: 0,
          sort: "sort_order",
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "blog-posts",
          depth: 0,
          limit: 0,
          sort: "-date_published",
          ...PUBLIC_READ,
        }),
        payload.find({
          collection: "career-entries",
          depth: 0,
          limit: 0,
          sort: "sort_order",
          ...PUBLIC_READ,
        }),
      ])

    siteSettings = settingsRes
    projects = projectsRes.docs.map((p) => ({ title: p.title, slug: p.slug }))
    blogPosts = blogPostsRes.docs.map((b) => ({
      title: b.title,
      slug: b.slug,
    }))
    careerEntries = careerRes.docs.map((c) => ({
      role: c.role,
      company: c.company,
      date_start: c.date_start,
      date_end: c.date_end ?? null,
    }))
  } catch (error) {
    console.error("[RootLayout] Payload fetch failed:", error)
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

  const resumePdfUrl = getMediaUrl(siteSettings.resume_pdf)

  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_URL

  return (
    <html
      lang="en"
      className={`dark ${jetbrainsMono.variable} ${michroma.variable}`}
      suppressHydrationWarning
    >
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
                fullName={siteSettings.full_name ?? null}
                tagline={siteSettings.tagline ?? null}
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
