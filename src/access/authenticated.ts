import type { Access } from "payload"

// Write access: only authenticated users (Payload admins) may create/update/delete.
// Mirrors Payload's built-in default (`Boolean(user)`), made explicit so the
// externally-reachable REST/GraphQL API can never be mutated anonymously.
export const authenticated: Access = ({ req: { user } }) => Boolean(user)
