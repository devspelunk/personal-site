import type { Metadata } from "next"
import Script from "next/script"
import { readSingleton } from "@directus/sdk"

import "./globals.css"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let siteSettings: SiteSettings
  try {
    const client = createDirectusServerClient()
    siteSettings = await client.request(readSingleton("site_settings"))
  } catch (error) {
    console.error("[RootLayout] Directus site_settings fetch failed:", error)
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
        <div className="flex min-h-screen flex-col">
          <Navbar social={social} />
          <main className="flex-1">{children}</main>
          <Footer social={social} resumePdfUrl={resumePdfUrl} />
        </div>
      </body>
    </html>
  )
}
