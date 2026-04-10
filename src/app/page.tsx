import { readItems, readSingleton } from "@directus/sdk"
import readingTime from "reading-time"

import { CareerHighlights } from "@/components/homepage/CareerHighlights"
import { FeaturedProjects } from "@/components/homepage/FeaturedProjects"
import { GitHubHeatmap } from "@/components/homepage/GitHubHeatmap"
import { HeroCodeAnimation } from "@/components/homepage/HeroCodeAnimation"
import { InteractiveTechStack } from "@/components/homepage/InteractiveTechStack"
import { LatestBlogPosts } from "@/components/homepage/LatestBlogPosts"
import { Testimonials } from "@/components/homepage/Testimonials"
import { createDirectusServerClient } from "@/lib/directus"
import { fetchGitHubContributions } from "@/lib/github"
import { jsonLdScriptHtml } from "@/lib/jsonld"
import { getServerSiteUrl } from "@/lib/site-url"

export const revalidate = 3600

type FeaturedProjectRow = {
  id: string
  slug: string
  title: string
  short_description: string | null
  thumbnail: string | null
  projects_tags?: { tag_id: { id: string; name: string } }[]
}

type HomeBlogPostRow = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  date_published: string | null
  body_markdown: string | null
  blog_posts_tags?: { tag_id: { id: string; name: string } }[]
}

export default async function HomePage() {
  const client = createDirectusServerClient()

  const [
    siteSettings,
    projects,
    careerEntries,
    blogPosts,
    techStackItems,
    testimonials,
  ] = await Promise.all([
    client.request(readSingleton("site_settings")),
    client.request(
      readItems("projects", {
        filter: { is_featured: { _eq: true }, status: { _eq: "published" } },
        fields: [
          "id",
          "slug",
          "title",
          "short_description",
          "thumbnail",
          { projects_tags: [{ tag_id: ["id", "name"] }] },
        ],
        limit: 3,
      } as never)
    ),
    client.request(
      readItems("career_entries", {
        filter: { is_homepage_highlight: { _eq: true } },
        sort: ["sort_order"],
      })
    ),
    client.request(
      readItems("blog_posts", {
        filter: { status: { _eq: "published" } },
        sort: ["-date_published"],
        limit: 3,
        fields: [
          "id",
          "slug",
          "title",
          "excerpt",
          "date_published",
          "body_markdown",
          { blog_posts_tags: [{ tag_id: ["id", "name"] }] },
        ],
      } as never)
    ),
    client.request(
      readItems("tech_stack_items", {
        sort: ["sort_order"],
      })
    ),
    client.request(
      readItems("testimonials", {
        filter: { is_homepage_featured: { _eq: true } },
        sort: ["sort_order"],
      })
    ),
  ])

  const featuredProjects = projects as FeaturedProjectRow[]
  const latestBlogRows = blogPosts as HomeBlogPostRow[]

  const blogPostsWithReadTime = latestBlogRows.map(
    ({ body_markdown, ...post }) => ({
      ...post,
      readTime: body_markdown
        ? Math.ceil(readingTime(body_markdown).minutes)
        : null,
    })
  )

  const contributions = siteSettings.github_username
    ? await fetchGitHubContributions(siteSettings.github_username)
    : []

  const siteUrl = getServerSiteUrl()
  const displayName = siteSettings.full_name ?? "Michael Lemus"
  const sameAs = [
    siteSettings.linkedin_url,
    siteSettings.github_username
      ? `https://github.com/${siteSettings.github_username}`
      : null,
    siteSettings.twitter_url,
    siteSettings.bluesky_handle
      ? `https://bsky.app/profile/${siteSettings.bluesky_handle}`
      : null,
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
          fullName={siteSettings.full_name ?? "Engineer"}
          tagline={siteSettings.tagline ?? "Building things that matter."}
          role={
            siteSettings.role?.trim()
              ? siteSettings.role.trim()
              : "Full-Stack Engineer"
          }
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

      {blogPostsWithReadTime.length > 0 && (
        <section className="border-t border-border py-12">
          <LatestBlogPosts posts={blogPostsWithReadTime} />
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
