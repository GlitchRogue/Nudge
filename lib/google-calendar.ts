import type { CalendarEvent } from "./mockData"

interface GoogleCalendarEvent {
  id: string
  summary?: string
  location?: string
  description?: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
}

/**
 * Fetches the authenticated user's primary Google Calendar events
 * for the next 7 days, normalized into the app's CalendarEvent shape.
 */
export async function fetchGoogleCalendarEvents(
  accessToken: string,
): Promise<CalendarEvent[]> {
  const now = new Date()
  const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const url = new URL(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
  )
  url.searchParams.set("timeMin", now.toISOString())
  url.searchParams.set("timeMax", oneWeekLater.toISOString())
  url.searchParams.set("singleEvents", "true")
  url.searchParams.set("orderBy", "startTime")
  url.searchParams.set("maxResults", "50")

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Google Calendar API failed: ${res.status} ${text}`)
  }

  const data = (await res.json()) as { items?: GoogleCalendarEvent[] }
  const items = data.items ?? []

  return items
    .filter((item) => item.start?.dateTime || item.start?.date)
    .map((item, idx): CalendarEvent => {
      // Use dateTime if it exists (timed event), else fall back to date (all-day)
      const startISO = item.start.dateTime ?? item.start.date!
      const endISO = item.end.dateTime ?? item.end.date!

      // Best-effort categorization based on title keywords
      const title = item.summary || "Untitled event"
      const lower = title.toLowerCase()
      let type: CalendarEvent["type"] = "personal"
      if (/(class|lecture|seminar|recitation|cs|econ|math|hist|phil)/.test(lower)) type = "class"
      else if (/(club|meeting|society|org)/.test(lower)) type = "club"
      else if (/(work|shift|internship|office)/.test(lower)) type = "work"

      return {
        id: item.id || `gcal-${idx}`,
        title,
        location: item.location || "",
        startTime: new Date(startISO),
        endTime: new Date(endISO),
        type,
        priority: type === "class" || type === "work" ? "high" : "medium",
      }
    })
}
