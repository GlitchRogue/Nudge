"use server"

import { auth } from "@/auth"
import { fetchGoogleCalendarEvents } from "@/lib/google-calendar"
import type { CalendarEvent } from "@/lib/mockData"

/**
 * Returns the user's Google Calendar events for the next 7 days,
 * or null if they're not authenticated.
 */
export async function getMyCalendar(): Promise<{
  events: CalendarEvent[] | null
  error: string | null
}> {
  const session = await auth()
  if (!session?.accessToken) {
    return { events: null, error: "Not authenticated" }
  }

  try {
    const events = await fetchGoogleCalendarEvents(session.accessToken)
    return { events, error: null }
  } catch (err) {
    return {
      events: null,
      error: err instanceof Error ? err.message : "Unknown error",
    }
  }
}
