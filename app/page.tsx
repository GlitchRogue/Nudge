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
  // so the demo never breaks. If it succeeds (even with 0 events), use real data.
  let events = mockCalendarEvents
  let usedRealData = false
  if (session.accessToken) {
    try {
      const real = await fetchGoogleCalendarEvents(session.accessToken)
      events = real
      usedRealData = true
      console.log(`[Nudge] Loaded ${real.length} real calendar events`)
    } catch (err) {
      console.error("[Nudge] Calendar fetch failed, using mock data:", err)
    }
  }
  console.log(`[Nudge] usedRealData=${usedRealData}, eventCount=${events.length}`)

  return (
    <CampusAgentClient
      calendarEvents={events}
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
    />
  )
}
