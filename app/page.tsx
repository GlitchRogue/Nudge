import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { fetchGoogleCalendarEvents } from "@/lib/google-calendar"
import { calendarEvents as mockCalendarEvents } from "@/lib/mockData"
import { getProfile } from "@/lib/profile"
import { searchEvents } from "@/lib/event-search"
import CampusAgentClient from "./campus-agent-client"

export default async function Page() {
  const session = await auth()

  // Not signed in → bounce to login
  if (!session?.user) {
    redirect("/login")
  }

  // Signed in but no profile yet → bounce to onboarding
  const profile = await getProfile()
  if (!profile) {
    redirect("/onboarding")
  }

  // Try to fetch real Google Calendar events.
  // If the API call fails (token issue, scope missing, network), fall back
  // to mocks so the demo never breaks. If it succeeds (even with 0 events),
  // use real data.
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
  console.log(
    `[Nudge] usedRealData=${usedRealData}, eventCount=${events.length}`,
  )

  // Generate personalized event suggestions based on the user's profile
  // and existing schedule. Falls back to empty array on error.
  let suggestions: Awaited<ReturnType<typeof searchEvents>> = []
  try {
    suggestions = await searchEvents(profile, events)
  } catch (err) {
    console.error("[Nudge] Suggestion generation failed:", err)
  }

  return (
    <CampusAgentClient
      calendarEvents={events}
      initialSuggestions={suggestions}
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      profileInterests={profile.interests}
    />
  )
}
