import type { Options as RehypePrettyCodeOptions } from "rehype-pretty-code"
import rehypePrettyCode from "rehype-pretty-code"
import rehypeStringify from "rehype-stringify"
import { remark } from "remark"

/**
 * Highlights a single code block with the site's shiki config. Used by the
 * renderer's `CodeBlock` converter.
 *
 * `rehype-parse` is not a resolvable dependency here (pnpm keeps it as a
 * transitive of `rehype-pretty-code` only), so instead of re-parsing HTML we
 * build the hast for one `<pre><code>` by hand and run it through
 * `rehype-pretty-code`.
 */

/**
 * The `rehype-pretty-code` config. A cohesive low-chroma dark theme (warm greys
 * + amber) that sits with the acid-on-dark palette; the code-block surface is
 * themed via globals.css.
 */
export const rehypePrettyCodeOptions: RehypePrettyCodeOptions = {
  theme: "vesper",
  keepBackground: false,
}

// A hast processor (no markdown parse step is ever invoked): we feed it a
// hand-built code tree via `.run()` and compile with `rehype-stringify`.
const codeHighlightProcessor = remark()
  .use(rehypePrettyCode, rehypePrettyCodeOptions)
  .use(rehypeStringify)

/**
 * Highlights one code block to `<figure data-rehype-pretty-code-figure>` markup.
 * Builds the hast a fenced code block produces (`<pre><code
 * class="language-<lang>">…\n</code></pre>`) and runs it through
 * `rehype-pretty-code`.
 */
export async function highlightCodeToHtml(args: {
  code: string
  language?: string | null
}): Promise<string> {
  const { code, language } = args
  // className only when a language is present; text is `value + "\n"`, and
  // empty code yields an empty text node rather than a lone "\n".
  const properties = language ? { className: [`language-${language}`] } : {}
  const value = code ? `${code.replace(/\n$/, "")}\n` : ""

  const tree = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "pre",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "code",
            properties,
            children: [{ type: "text", value }],
          },
        ],
      },
    ],
  }

  const transformed = await codeHighlightProcessor.run(
    tree as Parameters<typeof codeHighlightProcessor.run>[0],
  )

  return codeHighlightProcessor.stringify(
    transformed as Parameters<typeof codeHighlightProcessor.stringify>[0],
  )
}
