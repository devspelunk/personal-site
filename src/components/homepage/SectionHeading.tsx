import { VectorAccent } from "@/components/ornament/VectorAccent"

export const SectionHeading = ({
  command,
  variant = "section",
}: {
  command: string
  /** Use `page` for route-level headings (single document h1). */
  variant?: "page" | "section"
}) => {
  const className = "mb-6 flex items-center gap-2 font-mono text-lg text-primary"
  const content = (
    <>
      <VectorAccent shape="star" className="size-3 shrink-0 text-accent" />
      <span>{command}</span>
    </>
  )
  if (variant === "page") {
    return <h1 className={className}>{content}</h1>
  }
  return <h2 className={className}>{content}</h2>
}
