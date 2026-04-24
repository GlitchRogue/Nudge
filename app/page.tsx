import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { fetchGoogleCalendarEvents } from "@/lib/google-calendar"
import { calendarEvents as mockCalendarEvents } from "@/lib/mockData"
import CampusAgentClient from "./campus-agent-client"

export default async function Page() {
  const session = await auth()

  // Not signed in → bounce to login
  if (!session?.user) {
    redirect("/login")
  }

  // Signed in: try to fetch real Google Calendar events.
  // If the API call fails (token issue, scope missing, network), fall back to mocks
  // so the demo never breaks.
  let events = mockCalendarEvents
  if (session.accessToken) {
    try {
      const real = await fetchGoogleCalendarEvents(session.accessToken)
      if (real.length > 0) events = real
    } catch (err) {
      console.error("[Nudge] Calendar fetch failed, using mock data:", err)
    }
  }

  return (
    <CampusAgentClient
      calendarEvents={events}
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
    />
  )
}
