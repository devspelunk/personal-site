import Image from "next/image"
import Link from "next/link"

import { getAssetUrl } from "@/lib/assets"

export function CharacterCard({
  slug,
  name,
  class_role,
  portrait,
  campaignName,
}: {
  slug: string
  name: string
  class_role: string | null
  portrait: string | null
  campaignName: string
}) {
  return (
    <Link
      href={`/ttrpg/characters/${slug}`}
      className="flex flex-col items-center rounded-lg border border-border bg-card p-5 text-center transition-colors hover:border-primary"
    >
      <div className="mb-3 size-24 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
        {portrait ? (
          <Image
            src={getAssetUrl(portrait)}
            alt={name}
            width={96}
            height={96}
            className="size-full object-cover"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center font-mono text-xs text-muted-foreground"
            aria-hidden
          >
            —
          </div>
        )}
      </div>
      <h3 className="mb-1 font-mono text-base font-semibold text-foreground">
        {name}
      </h3>
      {class_role && (
        <p className="mb-2 text-sm text-purple-600 dark:text-purple-400">
          {class_role}
        </p>
      )}
      <p className="text-sm text-green-600 dark:text-green-400">
        {campaignName}
      </p>
    </Link>
  )
}
