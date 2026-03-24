"use client"

import { ActivityCalendar, type Activity } from "react-activity-calendar"

import { SectionHeading } from "./SectionHeading"

export const GitHubHeatmap = ({
  contributions,
}: {
  contributions: Activity[]
}) => {
  if (contributions.length === 0) return null

  return (
    <div>
      <SectionHeading command="$ git log --graph" />

      <div className="overflow-x-auto rounded-lg border border-border bg-card p-6">
        <ActivityCalendar
          data={contributions}
          colorScheme="dark"
          theme={{
            dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
          }}
          fontSize={12}
          blockSize={12}
          blockMargin={4}
        />
      </div>
    </div>
  )
}
