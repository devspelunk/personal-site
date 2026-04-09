"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Circle, Github, Linkedin, Mail, Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface NavbarProps {
  social?: {
    linkedinUrl?: string
    githubUrl?: string
    twitterUrl?: string
    blueskyUrl?: string
    email?: string
  }
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/ttrpg", label: "TTRPG" },
]

export const Navbar = ({ social }: NavbarProps) => {
  const pathname = usePathname()
  const showMusic = process.env.NEXT_PUBLIC_FEATURE_MUSIC === "true"

  const links = showMusic
    ? [...navItems, { href: "/music", label: "Music" }]
    : navItems

  return (
    <header className="sticky top-0 z-10 border-b border-[#21262d] bg-[#0d1117]">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-[#58a6ff]">
          ~/michael
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {social?.linkedinUrl && (
            <a
              href={social.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn profile"
            >
              <Linkedin className="size-4" suppressHydrationWarning />
            </a>
          )}
          {social?.githubUrl && (
            <a
              href={social.githubUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub profile"
            >
              <Github className="size-4" suppressHydrationWarning />
            </a>
          )}
          {social?.twitterUrl && (
            <a
              href={social.twitterUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter profile"
            >
              <X className="size-4" suppressHydrationWarning />
            </a>
          )}
          {social?.blueskyUrl && (
            <a
              href={social.blueskyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Bluesky profile"
            >
              <Circle className="size-4" suppressHydrationWarning />
            </a>
          )}
          {social?.email && (
            <a href={`mailto:${social.email}`} aria-label="Email">
              <Mail className="size-4" suppressHydrationWarning />
            </a>
          )}
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" suppressHydrationWarning />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="border-[#21262d] bg-[#0d1117] pt-12"
            >
              <nav className="flex flex-col gap-4">
                {links.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link href={link.href} className="text-sm text-foreground">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
