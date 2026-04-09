import "server-only"

import type { Activity } from "react-activity-calendar"

const CONTRIBUTIONS_API = "https://github-contributions-api.jogruber.de/v4"

interface ContributionsResponse {
  total: Record<string, number>
  contributions: Activity[]
}

export const fetchGitHubContributions = async (username: string) => {
  try {
    const res = await fetch(`${CONTRIBUTIONS_API}/${username}`, {
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.error(
        `Failed to fetch GitHub contributions for ${username}: ${res.status}`,
      )
      return []
    }

    const data: ContributionsResponse = await res.json()
    return data.contributions
  } catch (error) {
    console.error(
      `GitHub contributions request failed for ${username}:`,
      error instanceof Error ? error.message : error,
    )
    return []
  }
}
