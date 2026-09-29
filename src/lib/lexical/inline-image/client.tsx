"use client"

import { createClientFeature } from "@payloadcms/richtext-lexical/client"
import { slashMenuBasicGroupWithItems } from "@payloadcms/richtext-lexical/client"
import { toolbarAddDropdownGroupWithItems } from "@payloadcms/richtext-lexical/client"
import {
  $applyNodeReplacement,
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  DecoratorNode,
} from "@payloadcms/richtext-lexical/lexical"
import type { LexicalEditor, LexicalNode, NodeKey } from "@payloadcms/richtext-lexical/lexical"
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext"
import React, { useEffect } from "react"

import {
  createInlineImageMarkdownTransformer,
  INLINE_IMAGE_NODE_TYPE,
  INSERT_INLINE_IMAGE_COMMAND,
  type InlineImagePayload,
  type SerializedInlineImageNode,
} from "./shared"

/**
 * Browser-side inline-image node. Same `type` ('inlineImage') + serialization as
 * the server node, but `decorate` renders an actual `<img>` so authors see the
 * image inline while editing.
 */
export class InlineImageClientNode extends DecoratorNode<React.ReactElement> {
  __alt: string
  __src: string

  constructor(payload: InlineImagePayload, key?: NodeKey) {
    super(key)
    this.__src = payload.src
    this.__alt = payload.alt
  }

  static clone(node: InlineImageClientNode): InlineImageClientNode {
    return new InlineImageClientNode({ alt: node.__alt, src: node.__src }, node.__key)
  }

  static getType(): string {
    return INLINE_IMAGE_NODE_TYPE
  }

  static importJSON(serializedNode: SerializedInlineImageNode): InlineImageClientNode {
    return $createInlineImageClientNode({
      alt: serializedNode.alt,
      src: serializedNode.src,
    })
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span")
    span.className = "inline-image"
    return span
  }

  decorate(): React.ReactElement {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={this.__alt} className="inline-image__img" src={this.__src} />
    )
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

  getTextContent(): string {
    return `![${this.__alt}](${this.__src})`
  }

  isInline(): true {
    return true
  }

  updateDOM(): false {
    return false
  }
}

export function $createInlineImageClientNode(
  payload: InlineImagePayload,
): InlineImageClientNode {
  return $applyNodeReplacement(new InlineImageClientNode(payload))
}

export function $isInlineImageClientNode(
  node: LexicalNode | null | undefined,
): node is InlineImageClientNode {
  return node instanceof InlineImageClientNode
}

const inlineImageMarkdownTransformer = createInlineImageMarkdownTransformer({
  $createInlineImageNode: $createInlineImageClientNode,
  $isInlineImageNode: (node): node is InlineImageClientNode =>
    $isInlineImageClientNode(node as LexicalNode),
  nodeKlass: InlineImageClientNode,
})

// Registers the insert command dispatched by the slash-menu / toolbar items.
function InlineImagePlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand<InlineImagePayload>(
      INSERT_INLINE_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          $insertNodes([$createInlineImageClientNode(payload)])
        })
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}

const InlineImageIcon: React.FC = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="20"
  >
    <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="m21 15-5-5L5 21" />
  </svg>
)

// Prompts the author for src + alt, then dispatches the insert command.
const insertInlineImage = (editor: LexicalEditor): void => {
  if (typeof window === "undefined") {
    return
  }
  const src = window.prompt("Image URL")
  if (!src) {
    return
  }
  const alt = window.prompt("Alt text (for accessibility)") ?? ""
  editor.dispatchCommand(INSERT_INLINE_IMAGE_COMMAND, { alt, src })
}

export const InlineImageFeatureClient = createClientFeature({
  markdownTransformers: [inlineImageMarkdownTransformer],
  nodes: [InlineImageClientNode],
  plugins: [{ Component: InlineImagePlugin, position: "normal" }],
  slashMenu: {
    groups: [
      slashMenuBasicGroupWithItems([
        {
          Icon: InlineImageIcon,
          key: "inlineImage",
          keywords: ["image", "img", "inline image", "picture"],
          label: "Inline Image",
          onSelect: ({ editor }) => insertInlineImage(editor),
        },
      ]),
    ],
  },
  toolbarFixed: {
    groups: [
      toolbarAddDropdownGroupWithItems([
        {
          ChildComponent: InlineImageIcon,
          key: "inlineImage",
          label: "Inline Image",
          onSelect: ({ editor }) => insertInlineImage(editor),
        },
      ]),
    ],
  },
})
