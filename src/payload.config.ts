import path from "path"
import { fileURLToPath } from "url"

import { postgresAdapter } from "@payloadcms/db-postgres"
import { buildConfig } from "payload"
import sharp from "sharp"

import { BlogPosts } from "./collections/BlogPosts"
import { Campaigns } from "./collections/Campaigns"
import { CareerEntries } from "./collections/CareerEntries"
import { Media } from "./collections/Media"
import { Projects } from "./collections/Projects"
import { Tags } from "./collections/Tags"
import { TechStackItems } from "./collections/TechStackItems"
import { Testimonials } from "./collections/Testimonials"
import { TtrpgCharacters } from "./collections/TtrpgCharacters"
import { TtrpgHomebrew } from "./collections/TtrpgHomebrew"
import { TtrpgJournals } from "./collections/TtrpgJournals"
import { TtrpgLore } from "./collections/TtrpgLore"
import { Users } from "./collections/Users"
import { SiteSettings } from "./globals/SiteSettings"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: "users",
  },
  collections: [
    Users,
    Media,
    Tags,
    BlogPosts,
    Projects,
    Campaigns,
    TtrpgJournals,
    TtrpgCharacters,
    TtrpgLore,
    TtrpgHomebrew,
    CareerEntries,
    Testimonials,
    TechStackItems,
  ],
  globals: [SiteSettings],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
})
