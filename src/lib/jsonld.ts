export function buildBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Safe HTML for `<script type="application/ld+json">` when using dangerouslySetInnerHTML.
 * Escapes `<` so CMS-controlled strings cannot close the script block (e.g. `</script>`).
 */
export function jsonLdScriptHtml(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
