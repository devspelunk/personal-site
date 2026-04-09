"use client"

import Link from "next/link"
import { motion } from "framer-motion"

import { staggerChildren, staggerItem } from "@/lib/animations"
import { formatDate } from "@/lib/utils"

import { SectionHeading } from "./SectionHeading"

interface BlogPostPreview {
  id: string
  slug: string
  title: string
  excerpt: string | null
  date_published: string | null
  readTime: number | null
  blog_posts_tags?: { tag_id: { id: string; name: string } }[]
}

export const LatestBlogPosts = ({ posts }: { posts: BlogPostPreview[] }) => (
  <div>
    <SectionHeading command="$ tail -n 3 ~/blog/latest" />

    <motion.div
      variants={staggerChildren}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={staggerItem}>
          <Link
            href={`/blog/${post.slug}`}
            className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary"
          >
            <h3 className="mb-2 font-mono text-base font-semibold text-foreground">
              {post.title}
            </h3>

            {post.excerpt && (
              <p className="mb-3 line-clamp-3 text-sm text-muted-foreground">
                {post.excerpt}
              </p>
            )}

            <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
              {post.date_published && (
                <span>{formatDate(post.date_published)}</span>
              )}
              {post.readTime && <span>{post.readTime} min read</span>}
            </div>

            <div className="flex flex-wrap gap-2">
              {post.blog_posts_tags?.map((bt) => (
                <span
                  key={bt.tag_id.id}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs text-primary"
                >
                  {bt.tag_id.name}
                </span>
              ))}
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>

    <div className="mt-4">
      <Link href="/blog" className="text-sm text-primary hover:underline">
        View all posts →
      </Link>
    </div>
  </div>
)
