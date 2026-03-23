import { Circle, Github, Linkedin, Mail, Terminal, X } from "lucide-react"

const socialLinks = [
  { href: "https://www.linkedin.com", label: "LinkedIn", icon: Linkedin },
  { href: "https://github.com", label: "GitHub", icon: Github },
  { href: "https://x.com", label: "Twitter/X", icon: X },
  { href: "https://bsky.app", label: "Bluesky", icon: Circle },
  { href: "mailto:hello@example.com", label: "Email", icon: Mail },
]

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          {socialLinks.map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
            >
              <Icon className="size-4 text-muted-foreground transition-colors hover:text-foreground" />
            </a>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Michael Lemus
        </p>

        <span
          className="flex items-center gap-1 text-xs text-muted-foreground"
          aria-hidden="true"
        >
          <Terminal className="size-3.5" />
          &gt;_
        </span>
      </div>
    </footer>
  )
}
