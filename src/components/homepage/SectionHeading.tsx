export const SectionHeading = ({
  command,
  variant = "section",
}: {
  command: string
  /** Use `page` for route-level headings (single document h1). */
  variant?: "page" | "section"
}) => {
  const className = "mb-6 font-mono text-lg text-primary"
  if (variant === "page") {
    return <h1 className={className}>{command}</h1>
  }
  return <h2 className={className}>{command}</h2>
}
