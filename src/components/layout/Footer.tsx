"use client"

import { Circle, Github, Linkedin, Mail, Terminal, X } from "lucide-react"

import { useTerminal } from "@/components/TerminalContext"

interface FooterProps {
  social?: {
    linkedinUrl?: string
    githubUrl?: string
    twitterUrl?: string
    blueskyUrl?: string
    email?: string
  }
  resumePdfUrl?: string
}

export const Footer = ({ social, resumePdfUrl }: FooterProps) => {
  const { setOpen: setTerminalOpen } = useTerminal()

  const socialLinks = [
    social?.linkedinUrl && {
      href: social.linkedinUrl,
      label: "LinkedIn",
      icon: Linkedin,
    },
    social?.githubUrl && {
      href: social.githubUrl,
      label: "GitHub",
      icon: Github,
    },
    social?.twitterUrl && {
      href: social.twitterUrl,
      label: "Twitter/X",
      icon: X,
    },
    social?.blueskyUrl && {
      href: social.blueskyUrl,
      label: "Bluesky",
      icon: Circle,
    },
    social?.email && {
      href: `mailto:${social.email}`,
      label: "Email",
      icon: Mail,
    },
  ].filter(Boolean) as {
    href: string
    label: string
    icon: typeof Linkedin
  }[]

  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={href.startsWith("mailto:") ? undefined : "noreferrer"}
              aria-label={label}
            >
              <Icon
                className="size-4 text-muted-foreground transition-colors hover:text-foreground"
                suppressHydrationWarning
              />
            </a>
          ))}
          {resumePdfUrl && (
            <a
              href={resumePdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Download Resume (PDF)
            </a>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Michael Lemus
        </p>

        <button
          type="button"
          onClick={() => setTerminalOpen(true)}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:cursor-pointer hover:text-foreground"
          aria-label="Open terminal"
        >
          <Terminal className="size-3.5" suppressHydrationWarning />
          &gt;_
        </button>
      </div>
    </footer>
  )
}
