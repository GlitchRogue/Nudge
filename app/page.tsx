import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { fetchGoogleCalendarEvents } from "@/lib/google-calendar"
import { calendarEvents as mockCalendarEvents } from "@/lib/mockData"
import { getProfile } from "@/lib/profile"
import { searchEvents } from "@/lib/event-search"
import { isDemoMode, DEMO_USER, DEMO_PROFILE } from "@/lib/demo"
import CampusAgentClient from "./campus-agent-client"

interface PageProps {
  searchParams: Promise<{ demo?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const demo = isDemoMode(params)

  // ---------- DEMO MODE (for v0 previews) ----------
  if (demo) {
    const events = mockCalendarEvents
    const fallback = await searchEvents(DEMO_PROFILE, events).catch(() => [])
    return (
      <CampusAgentClient
        calendarEvents={events}
        initialSuggestions={fallback}
        userName={DEMO_USER.name}
        userEmail={DEMO_USER.email}
        profileInterests={DEMO_PROFILE.interests}
        backendEnabled
      />
    )
  }

  // ---------- REAL AUTH FLOW ----------
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const profile = await getProfile()
  if (!profile) {
    redirect("/onboarding")
  }

  // Fetch user's existing Google Calendar events on the server (we have the
  // accessToken here). Surface a clear error to the client when the call
  // fails so the user knows to re-auth instead of staring at empty cells.
  let events: typeof mockCalendarEvents = []
  let calendarError: string | null = null
  const sessionError = (session as any).error as string | undefined
  if (sessionError) {
    calendarError = `auth: ${sessionError}`
    console.warn(`[Nudge] Session has auth error: ${sessionError}`)
  }
  if (session.accessToken && !sessionError) {
    try {
      const real = await fetchGoogleCalendarEvents(session.accessToken)
      events = real
      console.log(`[Nudge] Loaded ${real.length} events from Google Calendar for ${session.user.email}`)
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      console.error("[Nudge] Calendar fetch failed:", msg)
      calendarError = msg
      events = []
    }
  } else if (!session.accessToken) {
    console.warn("[Nudge] No accessToken on session — cannot fetch Google Calendar")
    calendarError = "No access token — sign out and back in"
  }

  // Initial suggestions: local fallback. The client will immediately
  // try to refetch real ranked events from the FastAPI backend at
  // NEXT_PUBLIC_API_URL after mount (it has the cookies).
  const fallbackSuggestions = await searchEvents(profile, events).catch(
    () => [],
  )

  return (
    <CampusAgentClient
      calendarEvents={events}
      initialSuggestions={fallbackSuggestions}
      userName={session.user.name ?? undefined}
      userEmail={session.user.email ?? undefined}
      profileInterests={profile.interests}
      backendEnabled
      calendarError={calendarError}
    />
  )
}
