"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Circle, Github, Linkedin, Menu, X } from "lucide-react"

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
  }
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/ttrpg", label: "TTRPG" },
]

const socialLinksFallback = {
  linkedinUrl: "https://www.linkedin.com",
  githubUrl: "https://github.com",
  twitterUrl: "https://x.com",
  blueskyUrl: "https://bsky.app",
}

export const Navbar = ({ social }: NavbarProps) => {
  const pathname = usePathname()
  const showMusic = process.env.NEXT_PUBLIC_FEATURE_MUSIC === "true"

  const links = showMusic
    ? [...navItems, { href: "/music", label: "Music" }]
    : navItems

  const socialLinks = {
    linkedinUrl: social?.linkedinUrl ?? socialLinksFallback.linkedinUrl,
    githubUrl: social?.githubUrl ?? socialLinksFallback.githubUrl,
    twitterUrl: social?.twitterUrl ?? socialLinksFallback.twitterUrl,
    blueskyUrl: social?.blueskyUrl ?? socialLinksFallback.blueskyUrl,
  }

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
          <a
            href={socialLinks.linkedinUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn profile"
          >
            <Linkedin className="size-4" />
          </a>
          <a
            href={socialLinks.githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub profile"
          >
            <Github className="size-4" />
          </a>
          <a
            href={socialLinks.twitterUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Twitter profile"
          >
            <X className="size-4" />
          </a>
          <a
            href={socialLinks.blueskyUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Bluesky profile"
          >
            <Circle className="size-4" />
          </a>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
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
