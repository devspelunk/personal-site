import { existsSync, readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { basename, resolve } from "node:path"
import { stdin as input, stdout as output } from "node:process"
import { createInterface } from "node:readline/promises"
import { pathToFileURL } from "node:url"

import config from "@payload-config"
import { getPayload, type Payload } from "payload"

import type { CareerEntry, SiteSetting, TechStackItem } from "../src/payload-types"

const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse") as (
  data: Buffer
) => Promise<{ text: string }>

type ParsedCareer = Pick<
  CareerEntry,
  | "role"
  | "company"
  | "date_start"
  | "date_end"
  | "highlight"
  | "description_markdown"
  | "is_homepage_highlight"
  | "sort_order"
>

type ParsedTech = Pick<
  TechStackItem,
  "name" | "icon_slug" | "experience_years" | "context" | "sort_order"
>

type ParsedSitePatch = Pick<SiteSetting, "tagline" | "bio_markdown">

type DryRunPayload = {
  career_entries: ParsedCareer[]
  tech_stack_items: ParsedTech[]
  site_settings: ParsedSitePatch
}

const MONTH_MAP: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sept: "09",
  sep: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12",
}

const SECTION_HEADER_RE =
  /^(summary|objective|profile|work experience|experience|work history|employment|professional experience|core skills|skills|technical skills|technologies|education)\s*:?\s*$/i

const DATE_RANGE_CAPTURE_RE =
  /(\d{1,2}\/\d{4}|[A-Za-z]+\.?\s+\d{4})\s*(?:[–\-—\u2013\u2014]|\s+to\s+)\s*(Present|Current|\d{1,2}\/\d{4}|[A-Za-z]+\.?\s+\d{4})/i

/** Month tokens often get glued to the preceding company name in PDF text (e.g. `CommsorAug 2025`). */
const GLUED_MONTH_BEFORE_YEAR = new RegExp(
  String.raw`(?<=[A-Za-z])(September|October|November|December|February|January|August|March|April|June|July|May|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept|Sep|Oct|Nov|Dec)(?=\s+\d{4}\b)`,
  "gi"
)

function normalizeResumeLine(line: string) {
  let s = line.replace(GLUED_MONTH_BEFORE_YEAR, " $1")
  s = s.replace(/(?<=[A-Za-z])(?=\d{1,2}\/\d{4})/g, " ")
  s = s.replace(/([a-z])([A-Z][a-z]+,\s*[A-Z]{2}\b)/g, "$1 $2")
  return s.replace(/[ \t]{2,}/g, " ").trimEnd()
}

function normalizePdfResumeText(text: string) {
  return text
    .replace(/\r/g, "")
    .split(/\n/)
    .map((line) => normalizeResumeLine(line))
    .join("\n")
}

function splitRoleLocation(role: string) {
  return role.replace(/([a-z])([A-Z][a-z]+,\s*[A-Z]{2}\b)/g, "$1 $2").trim()
}

function stripSkillLabelFragment(token: string) {
  return token
    .replace(/^[-•*▪]\s*/, "")
    .replace(/^[^:\n]{1,48}:\s*/, "")
    .trim()
}

function loadOptionalEnvFiles() {
  const base = process.cwd()
  const paths = [
    resolve(base, ".env"),
    resolve(base, ".env.local"),
    resolve(base, "scripts", ".env"),
  ]
  for (const p of paths) {
    if (!existsSync(p)) continue
    const content = readFileSync(p, "utf8")
    for (const line of content.split("\n")) {
      const parsed = parseEnvLine(line)
      if (!parsed) continue
      const [k, v] = parsed
      if (process.env[k] === undefined) process.env[k] = v
    }
  }
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) return null
  const eq = trimmed.indexOf("=")
  if (eq === -1) return null
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  const doubleQuoted = value.startsWith('"') && value.endsWith('"')
  const singleQuoted = value.startsWith("'") && value.endsWith("'")
  if (doubleQuoted || singleQuoted) {
    value = value.slice(1, -1)
  } else {
    const commentAt = /\s+#/.exec(value)
    if (commentAt) {
      value = value.slice(0, commentAt.index).trimEnd()
    }
  }
  return [key, value]
}

function parseFlexibleDateToIso(raw: string) {
  const s = raw.trim()
  const slash = /^(\d{1,2})\/(\d{4})$/.exec(s)
  if (slash) {
    const [, mm, yyyy] = slash
    return `${yyyy}-${mm!.padStart(2, "0")}-01`
  }
  const word = /^([A-Za-z]+)\.?\s+(\d{4})$/.exec(s)
  if (word) {
    const mon = MONTH_MAP[word[1]!.toLowerCase()]
    if (mon) return `${word[2]}-${mon}-01`
  }
  return null
}

function extractDateRange(line: string) {
  const m = DATE_RANGE_CAPTURE_RE.exec(line)
  if (!m || m.index === undefined) return null
  return {
    startRaw: m[1]!.trim(),
    endRaw: m[2]!.trim(),
    index: m.index,
    matchLength: m[0].length,
  }
}

function splitRoleCompany(line: string) {
  const at = /\s+at\s+/i.exec(line)
  if (at) {
    return {
      role: line.slice(0, at.index).trim(),
      company: line.slice(at.index + at[0].length).trim(),
    }
  }
  const pipe = line.split("|").map((x) => x.trim())
  if (pipe.length >= 2) {
    return { role: pipe[0]!, company: pipe[pipe.length - 1]! }
  }
  const em = line.split("—").map((x) => x.trim())
  if (em.length >= 2) {
    return { role: em[0]!, company: em[1]! }
  }
  const trimmed = line.trim()
  return { role: trimmed || "Unknown role", company: "Unknown company" }
}

function isBulletLine(line: string) {
  return /^[-•*▪]\s*/.test(line)
}

function stripBullet(line: string) {
  return line.replace(/^[-•*▪]\s*/, "").trim()
}

function parseExperienceBlock(lines: string[]): ParsedCareer | null {
  const dateLineIdx = lines.findIndex((l) => extractDateRange(l))
  if (dateLineIdx === -1) return null
  const dateLine = lines[dateLineIdx]!
  const dr = extractDateRange(dateLine)
  if (!dr) return null
  const dateStart = parseFlexibleDateToIso(dr.startRaw)
  if (!dateStart) return null
  const endLower = dr.endRaw.toLowerCase()
  const dateEnd =
    endLower === "present" || endLower === "current"
      ? null
      : parseFlexibleDateToIso(dr.endRaw)

  const before = lines.slice(0, dateLineIdx).filter((l) => !isBulletLine(l))
  const bulletsFromRest = lines
    .slice(dateLineIdx + 1)
    .filter((l) => isBulletLine(l))
    .map(stripBullet)
  const bulletsBefore = lines
    .slice(0, dateLineIdx)
    .filter((l) => isBulletLine(l))
    .map(stripBullet)
  const bullets = [...bulletsBefore, ...bulletsFromRest].filter(Boolean)

  let role = ""
  let company = ""
  if (before.length >= 2) {
    role = splitRoleLocation(before[0]!)
    company = before[before.length - 1]!.trim()
  } else if (before.length === 1) {
    const sc = splitRoleCompany(before[0]!)
    role = splitRoleLocation(sc.role)
    company = sc.company.trim()
  } else {
    company = dateLine
      .slice(0, dr.index)
      .trim()
      .replace(/[\s:–\-—]+$/g, "")
    const afterDateNonBullets = lines
      .slice(dateLineIdx + 1)
      .filter((l) => !isBulletLine(l))
    const roleLine = afterDateNonBullets[0]
    if (!roleLine) return null
    role = splitRoleLocation(roleLine)
  }

  const description_markdown = bullets.map((b) => `- ${b}`).join("\n") || null
  const highlight = bullets[0] ?? null

  return {
    role,
    company,
    date_start: dateStart,
    date_end: dateEnd,
    highlight,
    description_markdown,
    is_homepage_highlight: false,
    sort_order: 0,
  }
}

function findSectionSpans(lines: string[]) {
  const headers: { name: string; index: number }[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim()
    if (SECTION_HEADER_RE.test(line)) {
      const name = line.replace(/[:.\s]+$/g, "").trim()
      headers.push({ name, index: i })
    }
  }
  return headers
}

function sliceSection(text: string, label: RegExp, nextLabels: RegExp[]) {
  const lines = text.split(/\r?\n/)
  const headers = findSectionSpans(lines)
  const idx = headers.findIndex((h) => label.test(h.name))
  if (idx === -1) return ""
  const start = headers[idx]!.index + 1
  const rest = headers.slice(idx + 1)
  const next = rest.find((h) => nextLabels.some((r) => r.test(h.name)))
  const end = next ? next.index : lines.length
  return lines.slice(start, end).join("\n").trim()
}

function parseSkillsSection(skillsText: string): ParsedTech[] {
  const raw: string[] = []
  for (const line of skillsText.split(/\r?\n/)) {
    const t = line.trim()
    if (!t) continue
    let payload = t
    if (/^[-•*▪]/.test(payload)) {
      payload = stripBullet(payload)
      const colon = payload.indexOf(":")
      if (colon !== -1) payload = payload.slice(colon + 1).trim()
    }
    for (const part of payload.split(/[,;]+/)) {
      const cleaned = stripSkillLabelFragment(part)
      if (cleaned) raw.push(cleaned)
    }
  }

  const seen = new Set<string>()
  const items: ParsedTech[] = []
  let order = 0
  for (const name of raw) {
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    items.push({
      name,
      icon_slug: name.toLowerCase().replace(/\s+/g, "-"),
      experience_years: null,
      context: null,
      sort_order: order++,
    })
  }
  return items
}

function splitExperienceIntoJobChunks(experienceText: string) {
  const lines = experienceText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const chunks: string[][] = []
  let current: string[] = []
  for (const line of lines) {
    if (extractDateRange(line)) {
      if (current.length > 0) chunks.push(current)
      current = [line]
    } else if (current.length > 0) {
      current.push(line)
    }
  }
  if (current.length > 0) chunks.push(current)
  return chunks
}

function parseExperienceSection(experienceText: string): ParsedCareer[] {
  const chunks = splitExperienceIntoJobChunks(experienceText)
  const entries: ParsedCareer[] = []
  for (const chunk of chunks) {
    const parsed = parseExperienceBlock(chunk)
    if (parsed) entries.push(parsed)
  }

  if (entries.length === 0) {
    const paragraphs = experienceText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
    for (const p of paragraphs) {
      const lines = p
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
      const parsed = parseExperienceBlock(lines)
      if (parsed) entries.push(parsed)
    }
  }

  if (entries.length === 0) {
    const lines = experienceText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const parsed = parseExperienceBlock(lines)
    if (parsed) entries.push(parsed)
  }

  return entries.map((e, i) => ({ ...e, sort_order: i }))
}

function parseResumeText(fullText: string): DryRunPayload {
  const normalized = normalizePdfResumeText(fullText).trim()
  const summaryLabels = /^(summary|objective|profile)$/i
  const experienceLabels =
    /^(work experience|experience|work history|employment|professional experience)$/i
  const skillsLabels = /^(core skills|skills|technical skills|technologies)$/i
  const educationLabels = /^education$/i

  const summaryText = sliceSection(normalized, summaryLabels, [
    experienceLabels,
    skillsLabels,
  ])
  const experienceText = sliceSection(normalized, experienceLabels, [
    skillsLabels,
    educationLabels,
  ])
  const skillsText = sliceSection(normalized, skillsLabels, [
    educationLabels,
    experienceLabels,
  ])

  const summaryLines = summaryText
    ? summaryText.split("\n").map((l) => l.trim())
    : normalized.split("\n").map((l) => l.trim())

  const firstNonEmpty = summaryLines.find((l) => l.length > 0) ?? ""
  const tagline = firstNonEmpty.slice(0, 280) || null
  const bio_markdown =
    (summaryText || normalized.split("\n").slice(0, 12).join("\n")).trim() ||
    null

  const career_entries = parseExperienceSection(experienceText || normalized)
  const tech_stack_items = parseSkillsSection(skillsText)

  return {
    career_entries,
    tech_stack_items,
    site_settings: { tagline, bio_markdown },
  }
}

async function confirmProceed() {
  const rl = createInterface({ input, output })
  const answer = (
    await rl.question("Proceed with import? Type y or yes to continue: ")
  ).trim()
  rl.close()
  return /^(y|yes)$/i.test(answer)
}

function printSummaryTable(
  rows: { collection: string; created: number; updated: number }[]
) {
  const w1 = Math.max(
    ...rows.map((r) => r.collection.length),
    "Collection".length
  )
  console.log(
    `${"Collection".padEnd(w1)} | ${"Created".padStart(7)} | ${"Updated".padStart(7)}`
  )
  console.log(`${"-".repeat(w1)}-|---------|---------`)
  for (const r of rows) {
    console.log(
      `${r.collection.padEnd(w1)} | ${String(r.created).padStart(7)} | ${String(r.updated).padStart(7)}`
    )
  }
}

type ImportSummaryRow = { collection: string; created: number; updated: number }

/**
 * Write path: pushes parsed resume data into Payload via the Local API.
 *
 * Extracted from `main()` so the create / update / updateGlobal code path can be
 * exercised directly (e.g. from a verification harness feeding mock parsed data)
 * without re-parsing a PDF or running the interactive confirm prompt.
 *
 * Upsert semantics mirror the previous Directus implementation:
 *   - career-entries:   matched on role + company
 *   - tech-stack-items: matched on name
 *   - media (resume PDF): matched on filename, reused if already uploaded
 *   - site-settings:    single global, always updated
 *
 * All writes run with `overrideAccess: true`, so no admin auth/token is required
 * (the Local API bypasses access control for trusted server-side callers).
 */
export async function importToPayload(
  payload: Payload,
  parsed: DryRunPayload,
  resumeFilePath?: string
): Promise<ImportSummaryRow[]> {
  // Upsert the resume PDF into the media collection (idempotent by filename).
  let resumeMediaId: number | null = null
  if (resumeFilePath) {
    const fileName = basename(resumeFilePath)
    const existingMedia = await payload.find({
      collection: "media",
      where: { filename: { equals: fileName } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    resumeMediaId = existingMedia.docs[0]?.id ?? null
    if (resumeMediaId == null) {
      const created = await payload.create({
        collection: "media",
        data: { alt: "Resume PDF" },
        filePath: resumeFilePath,
        overrideAccess: true,
      })
      resumeMediaId = created.id
    }
  }

  const careerStats = { created: 0, updated: 0 }
  for (const entry of parsed.career_entries) {
    const existing = await payload.find({
      collection: "career-entries",
      where: {
        and: [
          { role: { equals: entry.role } },
          { company: { equals: entry.company } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const row = existing.docs[0]
    if (row) {
      // Never overwrite a manually curated homepage-highlight flag on update.
      const { is_homepage_highlight, ...careerUpdate } = entry
      void is_homepage_highlight
      await payload.update({
        collection: "career-entries",
        id: row.id,
        data: careerUpdate,
        overrideAccess: true,
      })
      careerStats.updated++
    } else {
      await payload.create({
        collection: "career-entries",
        data: entry,
        overrideAccess: true,
      })
      careerStats.created++
    }
  }

  const techStats = { created: 0, updated: 0 }
  for (const item of parsed.tech_stack_items) {
    const existing = await payload.find({
      collection: "tech-stack-items",
      where: { name: { equals: item.name } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const row = existing.docs[0]
    if (row) {
      await payload.update({
        collection: "tech-stack-items",
        id: row.id,
        data: item,
        overrideAccess: true,
      })
      techStats.updated++
    } else {
      await payload.create({
        collection: "tech-stack-items",
        data: item,
        overrideAccess: true,
      })
      techStats.created++
    }
  }

  const siteData: Partial<
    Pick<SiteSetting, "resume_pdf" | "bio_markdown" | "tagline">
  > = {
    ...(resumeMediaId != null ? { resume_pdf: resumeMediaId } : {}),
    ...(parsed.site_settings.bio_markdown != null
      ? { bio_markdown: parsed.site_settings.bio_markdown }
      : {}),
    ...(parsed.site_settings.tagline != null
      ? { tagline: parsed.site_settings.tagline }
      : {}),
  }
  await payload.updateGlobal({
    slug: "site-settings",
    data: siteData,
    overrideAccess: true,
  })

  return [
    { collection: "career-entries", ...careerStats },
    { collection: "tech-stack-items", ...techStats },
    { collection: "site-settings", created: 0, updated: 1 },
  ]
}

async function main() {
  loadOptionalEnvFiles()

  const resumePath = process.env.RESUME_PDF_PATH
  if (!resumePath) {
    throw new Error(
      "RESUME_PDF_PATH is required. Set it in .env or the environment before running."
    )
  }

  const absoluteResumePath = resolve(process.cwd(), resumePath)
  const pdfBuffer = await readFile(absoluteResumePath)
  const { text } = await pdfParse(pdfBuffer)
  const parsed = parseResumeText(text)

  console.log(JSON.stringify(parsed, null, 2))

  const ok = await confirmProceed()
  if (!ok) {
    console.log("Aborted. No changes were written to Payload.")
    process.exit(0)
  }

  const payload = await getPayload({ config })
  const summary = await importToPayload(payload, parsed, absoluteResumePath)

  printSummaryTable(summary)
}

const isMain = import.meta.url === pathToFileURL(process.argv[1] ?? "").href

if (isMain) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
