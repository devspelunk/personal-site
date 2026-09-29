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

type BlocksFeatureProps = {
  blocks?: { slug: string }[]
  inlineBlocks?: { slug: string }[]
}

/**
 * Reads the block slugs registered through `BlocksFeature` on the sanitized
 * editor config, split by where they render (`block` vs `inlineBlock` nodes).
 */
export function getEnabledBlockSlugs(editorConfig: SanitizedServerEditorConfig): {
  blocks: string[]
  inlineBlocks: string[]
} {
  const feature = editorConfig.resolvedFeatureMap.get("blocks") as
    | { sanitizedServerFeatureProps?: BlocksFeatureProps }
    | undefined
  const props = feature?.sanitizedServerFeatureProps ?? {}

  return {
    blocks: (props.blocks ?? []).map((block) => block.slug),
    inlineBlocks: (props.inlineBlocks ?? []).map((block) => block.slug),
  }
}

// Block node types render via a per-slug sub-map (`blocks[blockType]` /
// `inlineBlocks[blockType]`), never via a top-level key of the node type.
const BLOCK_NODE_SUBMAPS: Record<string, "blocks" | "inlineBlocks"> = {
  block: "blocks",
  inlineBlock: "inlineBlocks",
}

/**
 * Coverage invariant: enabling a feature does NOT auto-register its render
 * converter, and the `/html` defaults omit the code-block converter. This helper
 * asserts every enabled feature node type has a key in the converter map, and
 * every enabled block slug has an entry in `blocks` / `inlineBlocks` (the maps
 * the renderer actually dispatches through), so a silently-dropped node becomes
 * a test failure instead of vanishing at render time. Returns the enabled node
 * types on success.
 */
export function assertConverterCoverage(args: {
  converters: LexicalConverterMap
  editorConfig: SanitizedServerEditorConfig
}): string[] {
  const { converters, editorConfig } = args
  const enabled = getEnabledNodeTypes(editorConfig)
  const missing = enabled.filter((type) => !(type in BLOCK_NODE_SUBMAPS) && !(type in converters))

  const slugs = getEnabledBlockSlugs(editorConfig)
  for (const submap of ["blocks", "inlineBlocks"] as const) {
    const registered = (converters[submap] ?? {}) as Record<string, unknown>
    for (const slug of slugs[submap]) {
      if (!(slug in registered)) missing.push(`${submap}.${slug}`)
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Lexical converter coverage gap — no converter registered for: ` +
        `${missing.join(", ")}. Add matching entries to the converter map.`,
    )
  }

  return enabled
}
