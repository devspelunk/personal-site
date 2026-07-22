import { createCommand } from "@payloadcms/richtext-lexical/lexical"
import type {
  LexicalCommand,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from "@payloadcms/richtext-lexical/lexical"
import type { TextMatchTransformer } from "@payloadcms/richtext-lexical/lexical/markdown"

export type InlineImagePayload = { alt: string; src: string }

// Dispatched by the admin insert UI (see ./client) to add an inline image.
// Lives here (isomorphic) so both the server + client features can reference it
// without the client bundle importing server-only feature code.
export const INSERT_INLINE_IMAGE_COMMAND: LexicalCommand<InlineImagePayload> =
  createCommand("INSERT_INLINE_IMAGE_COMMAND")

// Serialized shape persisted in the Lexical editor state (jsonb).
// `type` is pinned to the literal so server + client nodes interoperate.
export type SerializedInlineImageNode = Spread<
  { alt: string; src: string; type: "inlineImage"; version: 1 },
  SerializedLexicalNode
>

// The node type string shared by the server + client node classes.
export const INLINE_IMAGE_NODE_TYPE = "inlineImage"

// `![alt](src)` — alt may be empty, src excludes whitespace/parens (mirrors the
// built-in Link transformer's url class). The Link transformer uses a `(?<!!)`
// lookbehind, so it deliberately skips image syntax; no ordering conflict.
const IMPORT_REG_EXP = /!\[([^[\]]*)\]\(([^()\s]+)\)/
const TYPING_REG_EXP = /!\[([^[\]]*)\]\(([^()\s]+)\)$/

// Minimal structural contract the transformer needs from a node instance,
// so this factory stays isomorphic (no direct server/client node import).
export type InlineImageLike = {
  getAlt: () => string
  getSrc: () => string
}

/**
 * Builds the `![alt](src)` ↔ inline-image markdown transformer. Parametrised by
 * the node's `$create`/`$is` helpers so the server feature and the client
 * feature can each bind it to their own node class while sharing one definition.
 */
export function createInlineImageMarkdownTransformer<TNode extends LexicalNode & InlineImageLike>(args: {
  $createInlineImageNode: (payload: { alt: string; src: string }) => TNode
  $isInlineImageNode: (node: unknown) => node is TNode
  // The concrete node class, declared as the transformer dependency.
  nodeKlass: TextMatchTransformer["dependencies"][number]
}): TextMatchTransformer {
  const { $createInlineImageNode, $isInlineImageNode, nodeKlass } = args

  return {
    type: "text-match",
    dependencies: [nodeKlass],
    export: (node) => {
      if (!$isInlineImageNode(node)) {
        return null
      }
      return `![${node.getAlt()}](${node.getSrc()})`
    },
    importRegExp: IMPORT_REG_EXP,
    regExp: TYPING_REG_EXP,
    replace: (textNode, match) => {
      const [, alt, src] = match
      const imageNode = $createInlineImageNode({ alt: alt ?? "", src })
      textNode.replace(imageNode)
    },
    trigger: ")",
  }
}
