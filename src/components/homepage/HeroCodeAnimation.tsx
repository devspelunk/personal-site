"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

import { fadeIn } from "@/lib/animations"

const LINE_DELAY_MS = 120

export const HeroCodeAnimation = ({
  fullName,
  tagline,
}: {
  fullName: string
  tagline: string
}) => {
  const codeLines = [
    { text: "// welcome.ts", color: "text-muted-foreground" },
    { text: "const ", color: "text-[#ff7b72]", rest: "engineer = {" },
    {
      text: `  name: `,
      color: "text-foreground",
      value: `"${fullName}"`,
      valueColor: "text-[#a5d6ff]",
      suffix: ",",
    },
    {
      text: `  role: `,
      color: "text-foreground",
      value: `"Full-Stack Engineer"`,
      valueColor: "text-[#a5d6ff]",
      suffix: ",",
    },
    {
      text: `  focus: `,
      color: "text-foreground",
      value: `"building things that matter"`,
      valueColor: "text-[#a5d6ff]",
      suffix: ",",
    },
    { text: "};", color: "text-foreground" },
    { text: "", color: "text-foreground" },
    {
      text: "console",
      color: "text-foreground",
      rest: ".",
      fn: "log",
      fnArgs: "(engineer);",
    },
  ]

  const [visibleLines, setVisibleLines] = useState(0)
  const [showOutput, setShowOutput] = useState(false)

  useEffect(() => {
    if (visibleLines < codeLines.length) {
      const timer = setTimeout(
        () => setVisibleLines((v) => v + 1),
        LINE_DELAY_MS,
      )
      return () => clearTimeout(timer)
    }

    const outputTimer = setTimeout(() => setShowOutput(true), 300)
    return () => clearTimeout(outputTimer)
  }, [visibleLines, codeLines.length])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <span className="h-3 w-3 rounded-full bg-[#f85149]" />
          <span className="h-3 w-3 rounded-full bg-[#d29922]" />
          <span className="h-3 w-3 rounded-full bg-[#3fb950]" />
          <span className="ml-2 text-xs text-muted-foreground">
            welcome.ts
          </span>
        </div>

        <div className="p-4 font-mono text-sm leading-relaxed">
          {codeLines.slice(0, visibleLines).map((line, i) => (
            <div key={i} className="min-h-[1.5em]">
              {line.fn ? (
                <>
                  <span className={line.color}>{line.text}</span>
                  <span className="text-foreground">{line.rest}</span>
                  <span className="text-[#d2a8ff]">{line.fn}</span>
                  <span className="text-foreground">{line.fnArgs}</span>
                </>
              ) : line.value ? (
                <>
                  <span className={line.color}>{line.text}</span>
                  <span className={line.valueColor}>{line.value}</span>
                  <span className="text-foreground">{line.suffix}</span>
                </>
              ) : line.rest ? (
                <>
                  <span className={line.color}>{line.text}</span>
                  <span className="text-foreground">{line.rest}</span>
                </>
              ) : (
                <span className={line.color}>{line.text}</span>
              )}
            </div>
          ))}
        </div>

        {showOutput && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            className="border-t border-border px-4 py-3 font-mono text-sm"
          >
            <span className="text-accent">▸</span>{" "}
            <span className="text-foreground">
              {tagline}
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-[blink_1s_step-end_infinite] bg-primary align-middle" />
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
