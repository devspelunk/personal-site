import type { Access } from "payload"

// Read access for drafted collections. Authenticated users (admins) get full
// access, including drafts. Anonymous callers on the public REST/GraphQL API are
// constrained to published documents via the returned `where` query, so
// unpublished drafts never leak.
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  return {
    _status: {
      equals: "published",
    },
  }
}
