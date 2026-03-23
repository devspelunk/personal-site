import type { Metadata } from "next"

import "./globals.css"

import { Footer } from "@/components/layout/Footer"
import { Navbar } from "@/components/layout/Navbar"

export const metadata: Metadata = {
  title: {
    default: "Michael Lemus",
    template: "%s | Michael Lemus",
  },
  description:
    "Software engineer portfolio, projects, writing, and TTRPG notes by Michael Lemus.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    images: ["/og-default.svg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
