/** Formats snake_case homebrew types (e.g. character_class) for display. */
export function formatHomebrewTypeLabel(type: string) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}
