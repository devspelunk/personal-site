import readingTime from "reading-time"

import { CareerHighlights } from "@/components/homepage/CareerHighlights"
import { FeaturedProjects } from "@/components/homepage/FeaturedProjects"
import { GitHubHeatmap } from "@/components/homepage/GitHubHeatmap"
import { HeroCodeAnimation } from "@/components/homepage/HeroCodeAnimation"
import { InteractiveTechStack } from "@/components/homepage/InteractiveTechStack"
import { LatestBlogPosts } from "@/components/homepage/LatestBlogPosts"
import { Testimonials } from "@/components/homepage/Testimonials"
import { fetchGitHubContributions } from "@/lib/github"
import { jsonLdScriptHtml } from "@/lib/jsonld"
import { getMediaUrl } from "@/lib/media"
import { getPayload } from "@/lib/payload"
import { getServerSiteUrl } from "@/lib/site-url"
import type {
  CareerEntry,
  Project,
  TechStackItem,
  Testimonial,
  Tag,
} from "@/payload-types"

export const revalidate = 3600

// Anonymous reads: `overrideAccess: false` runs `authenticatedOrPublished`, so
// drafted collections (projects, blog-posts) return only published docs.
const PUBLIC_READ = { overrideAccess: false } as const

/** Keep only the tag relations Payload populated at depth >= 1. */
function resolveTags(
  tags: (number | Tag)[] | null | undefined
): { id: number; name: string }[] {
  return (tags ?? [])
    .filter((tag): tag is Tag => typeof tag === "object" && tag !== null)
    .map((tag) => ({ id: tag.id, name: tag.name }))
}

export default async function HomePage() {
  let fullName: string | null = null
  let tagline: string | null = null
  let role: string | null = null
  let githubUsername: string | null = null
  let linkedinUrl: string | null = null
  let twitterUrl: string | null = null
  let blueskyHandle: string | null = null

  let featuredProjects: {
    id: number
    slug: string
    title: string
    short_description: string | null
    thumbnail: string | null
    tags: { id: number; name: string }[]
  }[] = []
  let careerEntries: CareerEntry[] = []
  let latestBlogPosts: {
    id: number
    slug: string
    title: string
    excerpt: string | null
    date_published: string | null
    readTime: number | null
    tags: { id: number; name: string }[]
  }[] = []
  let techStackItems: TechStackItem[] = []
  let testimonials: Testimonial[] = []

  try {
    const payload = await getPayload()
    const [
      siteSettings,
      projectsRes,
      careerRes,
      blogRes,
      techRes,
      testimonialsRes,
    ] = await Promise.all([
      payload.findGlobal({ slug: "site-settings", depth: 0, ...PUBLIC_READ }),
      payload.find({
        collection: "projects",
        depth: 1,
        where: { is_featured: { equals: true } },
        sort: "sort_order",
        limit: 3,
        ...PUBLIC_READ,
      }),
      payload.find({
        collection: "career-entries",
        depth: 0,
        where: { is_homepage_highlight: { equals: true } },
        sort: "sort_order",
        limit: 0,
        ...PUBLIC_READ,
      }),
      payload.find({
        collection: "blog-posts",
        depth: 1,
        sort: "-date_published",
        limit: 3,
        ...PUBLIC_READ,
      }),
      payload.find({
        collection: "tech-stack-items",
        depth: 0,
        sort: "sort_order",
        limit: 0,
        ...PUBLIC_READ,
      }),
      payload.find({
        collection: "testimonials",
        depth: 1,
        where: { is_homepage_featured: { equals: true } },
        sort: "sort_order",
        limit: 0,
        ...PUBLIC_READ,
      }),
    ])

    fullName = siteSettings.full_name ?? null
    tagline = siteSettings.tagline ?? null
    role = siteSettings.role ?? null
    githubUsername = siteSettings.github_username ?? null
    linkedinUrl = siteSettings.linkedin_url ?? null
    twitterUrl = siteSettings.twitter_url ?? null
    blueskyHandle = siteSettings.bluesky_handle ?? null

    featuredProjects = projectsRes.docs.map((project: Project) => ({
      id: project.id,
      slug: project.slug,
      title: project.title,
      short_description: project.short_description ?? null,
      thumbnail: getMediaUrl(project.thumbnail) ?? null,
      tags: resolveTags(project.tags),
    }))

    careerEntries = careerRes.docs
    techStackItems = techRes.docs
    testimonials = testimonialsRes.docs

    latestBlogPosts = blogRes.docs.map((post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt ?? null,
      date_published: post.date_published ?? null,
      readTime: post.body_markdown
        ? Math.ceil(readingTime(post.body_markdown).minutes)
        : null,
      tags: resolveTags(post.tags),
    }))
  } catch (error) {
    console.error("[HomePage] payload fetch failed", error)
  }

  const contributions = githubUsername
    ? await fetchGitHubContributions(githubUsername)
    : []

  const siteUrl = getServerSiteUrl()
  const displayName = fullName ?? "Michael Lemus"
  const sameAs = [
    linkedinUrl,
    githubUsername ? `https://github.com/${githubUsername}` : null,
    twitterUrl,
    blueskyHandle ? `https://bsky.app/profile/${blueskyHandle}` : null,
  ].filter((url): url is string => Boolean(url))

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: siteUrl,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptHtml(personJsonLd) }}
      />
      <section className="py-12">
        <HeroCodeAnimation
          fullName={fullName ?? "Engineer"}
          tagline={tagline ?? "Building things that matter."}
          role={role?.trim() ? role.trim() : "Full-Stack Engineer"}
        />
      </section>

      {featuredProjects.length > 0 && (
        <section className="border-t border-border py-12">
          <FeaturedProjects projects={featuredProjects} />
        </section>
      )}

      {contributions.length > 0 && (
        <section className="border-t border-border py-12">
          <GitHubHeatmap contributions={contributions} />
        </section>
      )}

      {careerEntries.length > 0 && (
        <section className="border-t border-border py-12">
          <CareerHighlights entries={careerEntries} />
        </section>
      )}

      {latestBlogPosts.length > 0 && (
        <section className="border-t border-border py-12">
          <LatestBlogPosts posts={latestBlogPosts} />
        </section>
      )}

      {techStackItems.length > 0 && (
        <section className="border-t border-border py-12">
          <InteractiveTechStack items={techStackItems} />
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="border-t border-border py-12">
          <Testimonials testimonials={testimonials} />
        </section>
      )}
    </div>
  )
}
