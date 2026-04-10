import type { ReactNode } from "react"

export type TerminalLine = {
  id: string
  content: string | ReactNode
  type: "output" | "input"
  tone?: "default" | "destructive"
}

export interface TerminalProps {
  fullName: string | null
  tagline: string | null
  projects: { title: string; slug: string }[]
  blogPosts: { title: string; slug: string }[]
  careerEntries: {
    role: string
    company: string
    date_start: string
    date_end: string | null
  }[]
  resumeUrl: string | null
}

export type CommandHelpers = {
  navigate: (path: string) => void
  close: () => void
}

export type CommandResult = TerminalLine[] | { type: "clear" }

type CommandFn = (
  args: string[],
  props: TerminalProps,
  helpers: CommandHelpers
) => CommandResult

export function isClearCommandResult(
  result: CommandResult
): result is { type: "clear" } {
  return !Array.isArray(result) && result.type === "clear"
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T|\s|$)/

function formatDate(value: string) {
  if (ISO_DATE_RE.test(value)) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    }
  }
  return value
}

function formatRange(start: string, end: string | null) {
  const a = formatDate(start)
  const b = end ? formatDate(end) : "present"
  return `${a} – ${b}`
}

function line(
  content: string | ReactNode,
  tone: "default" | "destructive" = "default"
): TerminalLine {
  return {
    id: crypto.randomUUID(),
    type: "output",
    content,
    tone,
  }
}

const SECTION_PATHS: Record<string, string> = {
  blog: "/blog",
  projects: "/projects",
  ttrpg: "/ttrpg",
  about: "/about",
}

const COMMANDS: Record<string, CommandFn> = {
  help: () => [
    line("  help       list available commands"),
    line("  whoami     display bio/intro"),
    line("  ls         list site sections"),
    line("  ls blog    list blog posts"),
    line("  ls projects list projects"),
    line("  cat resume.txt  print resume summary"),
    line("  history    show career timeline"),
    line("  cd <section> navigate to section"),
    line("  clear      clear terminal"),
    line("  exit       close terminal"),
  ],

  whoami: (_args, props) => {
    const name = props.fullName?.trim() || "(name not set)"
    const tag = props.tagline?.trim() || "(no tagline)"
    return [line(`${name}\n${tag}`)]
  },

  ls: (args, props) => {
    if (args.length === 0) {
      return [line("blog  projects  ttrpg  about")]
    }
    if (args[0] === "blog") {
      if (!props.blogPosts.length) {
        return [line("No published blog posts.")]
      }
      return props.blogPosts.map((p, i) =>
        line(`${i + 1}. ${p.title}  /blog/${p.slug}`)
      )
    }
    if (args[0] === "projects") {
      if (!props.projects.length) {
        return [line("No published projects.")]
      }
      return props.projects.map((p, i) =>
        line(`${i + 1}. ${p.title}  /projects/${p.slug}`)
      )
    }
    return [line(`ls: unknown target: ${args.join(" ")}`, "destructive")]
  },

  cat: (args, props) => {
    const operand = args[0]
    if (operand !== "resume" && operand !== "resume.txt") {
      return [
        line(
          `cat: ${args.length ? args.join(" ") : "(missing operand)"}`,
          "destructive"
        ),
      ]
    }

    const rows: TerminalLine[] = []
    if (!props.careerEntries.length) {
      rows.push(line("No career entries."))
    } else {
      for (const e of props.careerEntries) {
        const range = formatRange(e.date_start, e.date_end)
        rows.push(line(`${e.role} @ ${e.company} (${range})`))
      }
    }
    if (props.resumeUrl) {
      rows.push(line(`Download PDF: ${props.resumeUrl}`))
    }
    return rows
  },

  history: (_args, props) => {
    if (!props.careerEntries.length) {
      return [line("No career history.")]
    }
    return props.careerEntries.map((e) =>
      line(
        `${e.role} @ ${e.company} (${formatRange(e.date_start, e.date_end)})`
      )
    )
  },

  clear: () => ({ type: "clear" }),

  cd: (args, _props, helpers) => {
    if (!args.length) {
      return [line("cd: missing section", "destructive")]
    }
    const section = args[0]
    const path = SECTION_PATHS[section]
    if (!path) {
      return [line(`cd: no such section: ${section}`, "destructive")]
    }
    helpers.navigate(path)
    helpers.close()
    return []
  },

  exit: (_args, _props, helpers) => {
    helpers.close()
    return []
  },
}

export function runTerminalCommand(
  tokens: string[],
  rawLine: string,
  props: TerminalProps,
  helpers: CommandHelpers
): CommandResult {
  if (tokens.length === 0) {
    return []
  }

  const cmd = tokens[0]
  const args = tokens.slice(1)

  const handler = COMMANDS[cmd]
  if (!handler) {
    return [
      line(`command not found: ${rawLine.trim()}. Try 'help'.`, "destructive"),
    ]
  }

  return handler(args, props, helpers)
}
