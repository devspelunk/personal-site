import type { CollectionConfig } from "payload"

// Auth-only collection backing the Payload admin (kept from the T1 scaffold).
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
  },
  fields: [],
}
