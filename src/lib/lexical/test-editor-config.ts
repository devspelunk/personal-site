import type { SanitizedServerEditorConfig } from "@payloadcms/richtext-lexical"
import { buildConfig, type Config, type SanitizedConfig } from "payload"
import sharp from "sharp"

import { Media } from "@/collections/Media"
import { buildEditorConfig } from "@/lib/lexical"

/**
 * Test-only helper. Sanitizes a minimal Payload config that references only the
 * `media` collection (the Upload feature needs it). Sanitizing never touches a
 * database, so no `db` adapter is configured. Memoized: every test file shares
 * one sanitization.
 */
let payloadConfig: Promise<SanitizedConfig> | undefined
let editorConfig: Promise<SanitizedServerEditorConfig> | undefined

export function getTestPayloadConfig(): Promise<SanitizedConfig> {
  payloadConfig ??= buildConfig({
    collections: [Media],
    secret: "test-secret",
    sharp,
  } as unknown as Config)
  return payloadConfig
}

export function getTestEditorConfig(): Promise<SanitizedServerEditorConfig> {
  editorConfig ??= getTestPayloadConfig().then(buildEditorConfig)
  return editorConfig
}
