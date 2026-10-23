import type { RenderedBody } from "@/lib/lexical/body"
import { articleBodyClass, cn } from "@/lib/utils"

/**
 * DOM id of the body the table of contents tracks. `TableOfContents` scroll-
 * spies the headings inside the element with this id, so a page that shows a
 * TOC renders its body with `tocAnchor`. One per page.
 */
export const ARTICLE_BODY_ID = "article-body"

/**
 * Renders a rendered richText body with the shared article typography.
 *
 * No sanitizing here: `RenderedBody.html` is safe to inject by contract (see
 * the output-safety note in src/lib/lexical/render.ts). Has no server-only
 * imports, so client views such as `CareerHighlights` can use it too.
 */
export function ArticleBody({
  body,
  tocAnchor = false,
  className,
}: {
  body: Pick<RenderedBody, "html">
  /** Marks this as the body the table of contents tracks. */
  tocAnchor?: boolean
  className?: string
}) {
  return (
    <div
      id={tocAnchor ? ARTICLE_BODY_ID : undefined}
      className={cn(articleBodyClass, className)}
      dangerouslySetInnerHTML={{ __html: body.html }}
    />
  )
}
