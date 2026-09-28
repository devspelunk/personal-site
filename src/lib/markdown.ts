import readingTime from "reading-time"
import rehypeStringify from "rehype-stringify"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import { remark } from "remark"

import type { Heading } from "@/lib/lexical/rehype"
import {
  createHeadingIdsPlugin,
  rehypePrettyCodeOptions,
} from "@/lib/lexical/rehype"
import rehypePrettyCode from "rehype-pretty-code"

/**
 * Markdown → HTML renderer. **Retained only as the parity oracle** for
 * `src/lib/lexical/render.test.ts`, which proves `renderLexical` emits
 * byte-identical markup (heading ids, highlighted code) to this pipeline. It has
 * **no production callers** — every `(site)` page renders Lexical via
 * `renderLexical` after the T4 cutover. Do not reintroduce page imports.
 */
export const renderMarkdown = async (source: string) => {
  const headings: Heading[] = []
  const slugCounts = new Map<string, number>()

  const result = await remark()
    .use(remarkParse)
    .use(remarkRehype)
    .use(createHeadingIdsPlugin(headings, slugCounts))
    .use(rehypePrettyCode, rehypePrettyCodeOptions)
    .use(rehypeStringify)
    .process(source)

  return {
    html: String(result),
    headings,
    readTime: Math.ceil(readingTime(source).minutes),
  }
}

export type { Heading }
