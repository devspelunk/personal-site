import type { CollectionConfig } from "payload"

// Auth-only collection backing the Payload admin (kept from the initial scaffold).
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [],
}
