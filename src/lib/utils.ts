import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export const articleBodyClass =
  "max-w-none text-base leading-relaxed text-foreground " +
  "[&_p]:mb-4 [&_p]:leading-relaxed " +
  "[&_h1]:mb-4 [&_h1]:mt-10 [&_h1]:scroll-mt-24 [&_h1]:font-mono [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-primary " +
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:scroll-mt-24 [&_h2]:font-mono [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-primary " +
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:scroll-mt-24 [&_h3]:font-mono [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-primary " +
  "[&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:scroll-mt-24 [&_h4]:font-mono [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-primary " +
  "[&_h5]:mb-2 [&_h5]:mt-4 [&_h5]:scroll-mt-24 [&_h5]:font-mono [&_h5]:text-sm [&_h5]:font-semibold [&_h5]:text-primary " +
  "[&_h6]:mb-2 [&_h6]:mt-4 [&_h6]:scroll-mt-24 [&_h6]:font-mono [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:text-primary " +
  "[&_a]:text-primary [&_a]:underline " +
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 " +
  "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:my-1 " +
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm " +
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/50 [&_pre]:p-4 " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg " +
  "[&_hr]:my-8 [&_hr]:border-border"
