import readingTime from "reading-time"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { remark } from "remark"
import { visit } from "unist-util-visit"

interface Heading {
  id: string
  text: string
  level: number
}

interface HtmlElementNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HtmlElementNode[]
  value?: string
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const getHtmlNodeText = (node: HtmlElementNode): string => {
  if (node.type === "text" && typeof node.value === "string") {
    return node.value
  }

  if (Array.isArray(node.children)) {
    return node.children.map(getHtmlNodeText).join("")
  }

  return ""
}

const createUniqueSlug = (text: string, slugCounts: Map<string, number>) => {
  const baseSlug = slugify(text) || "section"
  const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1
  slugCounts.set(baseSlug, nextCount)

  return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`
}

export const renderMarkdown = async (source: string) => {
  const headings: Heading[] = []
  const slugCounts = new Map<string, number>()

  const addHeadingIds = () => {
    return (tree: HtmlElementNode) => {
      visit(tree, "element", (node) => {
        const headingNode = node as HtmlElementNode
        const tagName = headingNode.tagName ?? ""

        if (!/^h[1-6]$/.test(tagName)) {
          return
        }

        const text = getHtmlNodeText(headingNode).trim()

        if (!text) {
          return
        }

        const id = createUniqueSlug(text, slugCounts)
        const level = Number(tagName.slice(1))
        headingNode.properties = { ...(headingNode.properties ?? {}), id }

        headings.push({
          id,
          text,
          level,
        })
      })
    }
  }

  const result = await remark()
    .use(remarkParse)
    .use(remarkRehype)
    .use(addHeadingIds)
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(source)

  return {
    html: String(result),
    headings,
    readTime: Math.ceil(readingTime(source).minutes),
  }
}

export type { Heading }
