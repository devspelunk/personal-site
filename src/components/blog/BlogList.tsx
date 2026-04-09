import Link from "next/link"

import { BlogPostCard, type BlogPostCardTag } from "./BlogPostCard"

export interface BlogListPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  date_published: string | null
  readTime: number | null
  blog_posts_tags?: { tag_id: BlogPostCardTag }[]
}

function tagsFromPost(post: BlogListPost): BlogPostCardTag[] {
  return post.blog_posts_tags?.map((row) => row.tag_id).filter(Boolean) ?? []
}

function blogListPath(tagSlugs: string[]) {
  if (tagSlugs.length === 0) return "/blog"
  const q = new URLSearchParams()
  for (const s of tagSlugs) {
    q.append("tag", s)
  }
  return `/blog?${q.toString()}`
}

function uniqueTagsFromPosts(posts: BlogListPost[]) {
  const bySlug = new Map<string, BlogPostCardTag>()
  for (const post of posts) {
    for (const tag of tagsFromPost(post)) {
      bySlug.set(tag.slug, tag)
    }
  }
  return Array.from(bySlug.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  )
}

export function BlogList({
  posts,
  selectedTagSlugs,
}: {
  posts: BlogListPost[]
  selectedTagSlugs: string[]
}) {
  const uniqueTags = uniqueTagsFromPosts(posts)

  const filteredPosts =
    selectedTagSlugs.length === 0
      ? posts
      : posts.filter((post) => {
          const postSlugs = new Set(tagsFromPost(post).map((t) => t.slug))
          return selectedTagSlugs.some((s) => postSlugs.has(s))
        })

  const pillBase =
    "rounded-full px-3 py-1 text-xs transition-colors hover:text-foreground"
  const pillActive = "bg-primary text-primary-foreground"
  const pillInactive = "bg-secondary text-muted-foreground"

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2">
        <Link
          href="/blog"
          scroll={false}
          className={`${pillBase} ${
            selectedTagSlugs.length === 0 ? pillActive : pillInactive
          }`}
        >
          All
        </Link>
        {uniqueTags.map((tag) => {
          const active = selectedTagSlugs.includes(tag.slug)
          const nextSlugs = active
            ? selectedTagSlugs.filter((s) => s !== tag.slug)
            : [...selectedTagSlugs, tag.slug]
          return (
            <Link
              key={tag.id}
              href={blogListPath(nextSlugs)}
              scroll={false}
              className={`${pillBase} ${active ? pillActive : pillInactive}`}
            >
              {tag.name}
            </Link>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredPosts.map((post) => (
          <BlogPostCard
            key={post.id}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            date_published={post.date_published}
            readTime={post.readTime}
            tags={tagsFromPost(post)}
          />
        ))}
      </div>
    </div>
  )
}
