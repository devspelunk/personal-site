import {
  createDirectus,
  createItem,
  readFiles,
  readItems,
  rest,
  staticToken,
  updateItem,
  updateSingleton,
  uploadFiles,
} from "@directus/sdk"
import { existsSync, readFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { basename, resolve } from "node:path"
import { stdin as input, stdout as output } from "node:process"
import { createInterface } from "node:readline/promises"

import type {
  CareerEntry,
  DirectusSchema,
  SiteSettings,
  TechStackItem,
} from "../src/lib/types/directus"

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

type ParsedSitePatch = Pick<SiteSettings, "tagline" | "bio_markdown">

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
  /^(summary|objective|profile|experience|work history|employment|professional experience|skills|technical skills|technologies|education)\s*:?\s*$/i

const DATE_RANGE_CAPTURE_RE =
  /(\d{1,2}\/\d{4}|[A-Za-z]+\.?\s+\d{4})\s*(?:[–\-—\u2013\u2014]|\s+to\s+)\s*(Present|Current|\d{1,2}\/\d{4}|[A-Za-z]+\.?\s+\d{4})/i

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

function getDirectusUrl() {
  const url =
    process.env.DIRECTUS_INTERNAL_URL ?? process.env.NEXT_PUBLIC_DIRECTUS_URL
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_DIRECTUS_URL is required (or set DIRECTUS_INTERNAL_URL for the import script)."
    )
  }
  return url.replace(/\/$/, "")
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
  if (!m) return null
  return { startRaw: m[1]!.trim(), endRaw: m[2]!.trim() }
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
  const dr = extractDateRange(lines[dateLineIdx]!)
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
    role = before[0]!
    company = before[before.length - 1]!
  } else if (before.length === 1) {
    const sc = splitRoleCompany(before[0]!)
    role = sc.role
    company = sc.company
  } else {
    return null
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
  const raw = skillsText
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)

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

function parseExperienceSection(experienceText: string): ParsedCareer[] {
  const paragraphs = experienceText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
  const entries: ParsedCareer[] = []
  for (const p of paragraphs) {
    const lines = p
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    const parsed = parseExperienceBlock(lines)
    if (parsed) entries.push(parsed)
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
  const normalized = fullText.replace(/\r/g, "").trim()
  const summaryLabels = /^(summary|objective|profile)$/i
  const experienceLabels =
    /^(experience|work history|employment|professional experience)$/i
  const skillsLabels = /^(skills|technical skills|technologies)$/i
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

async function main() {
  loadOptionalEnvFiles()

  const resumePath = process.env.RESUME_PDF_PATH
  const adminToken = process.env.DIRECTUS_ADMIN_TOKEN
  if (!resumePath) {
    throw new Error(
      "RESUME_PDF_PATH is required. Set it in .env or the environment before running."
    )
  }
  if (!adminToken) {
    throw new Error(
      "DIRECTUS_ADMIN_TOKEN is required. Create an admin static token in Directus (Settings → Access Tokens) and set it before running."
    )
  }

  const directusUrl = getDirectusUrl()
  const absoluteResumePath = resolve(process.cwd(), resumePath)
  const pdfBuffer = await readFile(absoluteResumePath)
  const { text } = await pdfParse(pdfBuffer)
  const payload = parseResumeText(text)

  console.log(JSON.stringify(payload, null, 2))

  const ok = await confirmProceed()
  if (!ok) {
    console.log("Aborted. No changes were written to Directus.")
    process.exit(0)
  }

  const client = createDirectus<DirectusSchema>(directusUrl)
    .with(staticToken(adminToken))
    .with(rest())

  const fileName = basename(absoluteResumePath)

  const existingFileRows = await client.request(
    readFiles({
      filter: { filename_download: { _eq: fileName } },
      limit: 1,
      fields: ["id"],
    })
  )
  const existingFileId = existingFileRows[0]?.id

  let fileId: string | null =
    typeof existingFileId === "string" ? existingFileId : null

  if (!fileId) {
    const formData = new FormData()
    formData.append("file", new Blob([pdfBuffer]), fileName)

    const uploaded = await client.request(uploadFiles(formData))
    fileId =
      uploaded &&
      typeof uploaded === "object" &&
      "id" in uploaded &&
      typeof uploaded.id === "string"
        ? uploaded.id
        : Array.isArray(uploaded) &&
            uploaded[0] &&
            typeof uploaded[0].id === "string"
          ? uploaded[0].id
          : null

    if (!fileId) {
      throw new Error(
        "File upload succeeded but no file id was returned. Check the Directus files response shape."
      )
    }
  }

  const careerStats = { created: 0, updated: 0 }
  for (const entry of payload.career_entries) {
    const existing = await client.request(
      readItems("career_entries", {
        filter: {
          _and: [
            { role: { _eq: entry.role } },
            { company: { _eq: entry.company } },
          ],
        },
        limit: 1,
        fields: ["id"],
      })
    )
    const row = existing[0]
    if (row?.id) {
      const { is_homepage_highlight, ...careerUpdate } = entry
      void is_homepage_highlight
      await client.request(updateItem("career_entries", row.id, careerUpdate))
      careerStats.updated++
    } else {
      await client.request(createItem("career_entries", entry))
      careerStats.created++
    }
  }

  const techStats = { created: 0, updated: 0 }
  for (const item of payload.tech_stack_items) {
    const existing = await client.request(
      readItems("tech_stack_items", {
        filter: { name: { _eq: item.name } },
        limit: 1,
        fields: ["id"],
      })
    )
    const row = existing[0]
    if (row?.id) {
      await client.request(updateItem("tech_stack_items", row.id, item))
      techStats.updated++
    } else {
      await client.request(createItem("tech_stack_items", item))
      techStats.created++
    }
  }

  const siteSettingsPatch = {
    resume_pdf: fileId,
    ...(payload.site_settings.bio_markdown != null
      ? { bio_markdown: payload.site_settings.bio_markdown }
      : {}),
    ...(payload.site_settings.tagline != null
      ? { tagline: payload.site_settings.tagline }
      : {}),
  }

  await client.request(updateSingleton("site_settings", siteSettingsPatch))

  printSummaryTable([
    { collection: "career_entries", ...careerStats },
    { collection: "tech_stack_items", ...techStats },
    { collection: "site_settings", created: 0, updated: 1 },
  ])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
