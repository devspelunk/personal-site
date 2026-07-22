import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical"

/**
 * Converter map keyed by Lexical node type (e.g. `paragraph`, `heading`,
 * `upload`, `inlineImage`). Populated in T2 with the actual
 * `@payloadcms/richtext-lexical/html` converters (+ the hand-written
 * `blocks.Code` converter). Values are intentionally `unknown` here — T1 only
 * needs the *keys* to enforce coverage.
 */
export type LexicalConverterMap = Record<string, unknown>

/**
 * Reads the node `type` of every feature node registered on the sanitized
 * editor config. `features.nodes` entries hold either a Lexical node class
 * (a constructor, so `typeof === "function"`) or a `{ replace, with }`
 * replacement descriptor.
 */
export function getEnabledNodeTypes(editorConfig: SanitizedServerEditorConfig): string[] {
  const types = new Set<string>()

  for (const nodeWithHooks of editorConfig.features.nodes) {
    const node = nodeWithHooks.node
    const klass = typeof node === "function" ? node : node.replace
    types.add((klass as { getType: () => string }).getType())
  }

  return [...types]
}

/**
 * Coverage invariant: enabling a feature does NOT auto-register its render
 * converter, and the `/html` defaults omit the code-block converter. This helper
 * asserts every enabled feature node type has a key in the converter map, so a
 * silently-dropped node becomes a test/startup failure instead of vanishing at
 * render time.
 *
 * NOTE: block-based features (e.g. the premade `CodeBlock`) register a single
 * `block` node type; T2's converter map must therefore provide a `block` key
 * (dispatching per `blockType`). Returns the enabled node types on success.
 */
export function assertConverterCoverage(args: {
  converters: LexicalConverterMap
  editorConfig: SanitizedServerEditorConfig
}): string[] {
  const { converters, editorConfig } = args
  const enabled = getEnabledNodeTypes(editorConfig)
  const missing = enabled.filter((type) => !(type in converters))

  if (missing.length > 0) {
    throw new Error(
      `Lexical converter coverage gap — no converter registered for node type(s): ` +
        `${missing.join(", ")}. Add matching entries to the converter map (T2).`,
    )
  }

  return enabled
}

/**
 * The real render converter map (T2). Built in ./render (it needs the async
 * `@payloadcms/richtext-lexical/html-async` converters + the hand-written
 * `blocks.Code` + inline-image converters), re-exported here as the coverage
 * source of truth. Includes a top-level `block` key so the coverage assertion —
 * which keys off the enabled `block` node type — is satisfied, even though the
 * renderer dispatches blocks via `blocks[blockType]`.
 */
export { LEXICAL_CONVERTER_MAP } from "./render"
