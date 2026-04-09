import Link from "next/link"

import { formatDate } from "@/lib/utils"

export function RelatedPosts({
  posts,
}: {
  posts: {
    slug: string
    title: string
    date_published: string | null
    readTime: number | null
  }[]
}) {
  if (posts.length === 0) return null

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="mb-4 font-mono text-base text-primary">Related Posts</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="related-card min-w-[200px] flex-1 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <h3 className="mb-2 font-mono text-sm font-semibold text-foreground">
              {post.title}
            </h3>
            <p className="text-xs text-muted-foreground">
              {[
                post.date_published ? formatDate(post.date_published) : null,
                post.readTime != null ? `${post.readTime} min read` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
