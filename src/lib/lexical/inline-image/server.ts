import { createNode, createServerFeature } from "@payloadcms/richtext-lexical"
import {
  $applyNodeReplacement,
  DecoratorNode,
} from "@payloadcms/richtext-lexical/lexical"
import type {
  DOMExportOutput,
  LexicalNode,
  NodeKey,
} from "@payloadcms/richtext-lexical/lexical"

import {
  createInlineImageMarkdownTransformer,
  INLINE_IMAGE_NODE_TYPE,
  type InlineImagePayload,
  type SerializedInlineImageNode,
} from "./shared"

/**
 * Server-side inline-image node storing `{ src, alt }`.
 *
 * Mirrors the built-in HorizontalRule split: this class carries the
 * serialization + markdown contract and is registered on the *server* editor
 * config (so `convertMarkdownToLexical`/`convertLexicalToMarkdown` round-trip
 * `![alt](src)`). It never renders React on the server — `decorate` returns
 * null; the browser editor uses the matching client node in ./client.
 */
export class InlineImageServerNode extends DecoratorNode<null> {
  __alt: string
  __src: string

  constructor(payload: InlineImagePayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__alt = payload.alt
  }

  static clone(node: InlineImageServerNode): InlineImageServerNode {
    return new InlineImageServerNode({ alt: node.__alt, src: node.__src }, node.__key)
  }

  static getType(): string {
    return INLINE_IMAGE_NODE_TYPE
  }

  static importJSON(serializedNode: SerializedInlineImageNode): InlineImageServerNode {
    return $createInlineImageServerNode({
      alt: serializedNode.alt,
      src: serializedNode.src,
    })
  }

  createDOM(): HTMLElement {
    // Only invoked in the browser editor. The client node provides the real
    // rendering; this keeps the server class self-contained + isomorphic.
    const span = document.createElement("span")
    span.className = "inline-image"
    return span
  }

  decorate(): null {
    return null
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img")
    element.setAttribute("src", this.__src)
    element.setAttribute("alt", this.__alt)
    return { element }
  }

  exportJSON(): SerializedInlineImageNode {
    return {
      type: INLINE_IMAGE_NODE_TYPE,
      alt: this.__alt,
      src: this.__src,
      version: 1,
    }
  }

  getAlt(): string {
    return this.getLatest().__alt
  }

  getSrc(): string {
    return this.getLatest().__src
  }

  // Fallback used by the markdown exporter when this node is a top-level or
  // otherwise-unmatched child — keeps `![alt](src)` output stable.
  getTextContent(): string {
    return `![${this.__alt}](${this.__src})`
  }

  isInline(): true {
    return true
  }

  setAlt(alt: string): void {
    this.getWritable().__alt = alt
  }

  setSrc(src: string): void {
    this.getWritable().__src = src
  }

  updateDOM(): false {
    return false
  }
}

export function $createInlineImageServerNode(
  payload: InlineImagePayload,
): InlineImageServerNode {
  return $applyNodeReplacement(new InlineImageServerNode(payload))
}

export function $isInlineImageServerNode(
  node: LexicalNode | null | undefined,
): node is InlineImageServerNode {
  return node instanceof InlineImageServerNode
}

const inlineImageMarkdownTransformer = createInlineImageMarkdownTransformer({
  $createInlineImageNode: $createInlineImageServerNode,
  $isInlineImageNode: (node): node is InlineImageServerNode =>
    $isInlineImageServerNode(node as LexicalNode),
  nodeKlass: InlineImageServerNode,
})

/**
 * Server feature registering the inline-image node + its `![alt](src)` markdown
 * transformer, and pointing the admin at the client feature (resolved through
 * the tsconfig `@/*` alias by `payload generate:importmap`).
 */
export const InlineImageFeature = createServerFeature({
  key: "inlineImage",
  feature: {
    ClientFeature: "@/lib/lexical/inline-image/client#InlineImageFeatureClient",
    markdownTransformers: [inlineImageMarkdownTransformer],
    nodes: [createNode({ node: InlineImageServerNode })],
  },
})
