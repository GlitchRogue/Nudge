import type {
  CalendarEvent,
  EventSuggestion,
  AvailableEvent,
  EventSource,
} from "./mockData"
import type { NudgeProfile } from "./profile"
import type { RankedEvent } from "./api-client"

/**
 * Convert a backend RankedEvent into the EventSuggestion shape the UI uses.
 */
export function rankedToSuggestion(r: RankedEvent): EventSuggestion {
  const event: AvailableEvent = {
    id: r.event.id,
    title: r.event.title,
    description: r.event.description,
    location: r.event.location_text,
    startTime: new Date(r.event.start_time),
    endTime: new Date(r.event.end_time),
    source: mapSource(r.event.source),
    category: r.event.tags[0] ?? "Event",
    tags: r.event.tags,
  }
  const reasoning: string[] = [r.reason]
  // Surface signal breakdown as bullets so the demo can show "why"
  if (r.signals) {
    if (r.signals.interest >= 0.8) reasoning.push("Strong match with your interests")
    if (r.signals.location >= 0.8) reasoning.push("Close by — short travel time")
    if (r.signals.cost === 1) reasoning.push("Free")
    if (r.conflict) reasoning.push("⚠ Conflicts with your calendar")
  }
  return {
    event,
    matchScore: Math.round(r.score * 100),
    matchReason: r.reason,
    reasoning,
  }
}

function mapSource(s: string): EventSource {
  const lower = s.toLowerCase()
  if (lower.includes("eventbrite")) return "Eventbrite"
  if (lower.includes("engage") || lower.includes("luma") || lower.includes("partiful"))
    return "Campus Portal"
  if (lower.includes("wasserman") || lower.includes("career")) return "Career Center"
  return "Newsletter"
}

/**
 * ============================================================
 *  TEAMMATE INTEGRATION POINT (legacy stub, kept for fallback)
 * ============================================================
 *
 *  This function is now only used as a fallback when the backend
 *  API is unreachable. The real ranking happens server-side at
 *  /events on the FastAPI backend (see lib/api-client.ts).
 * ============================================================
 */
export async function searchEvents(
  profile: NudgeProfile,
  calendar: CalendarEvent[],
): Promise<EventSuggestion[]> {
  // === LOCAL FALLBACK MOCK (only fires if backend API is down) ===
  const now = new Date()
  const tomorrow = addDays(now, 1)
  const dayAfter = addDays(now, 2)
  const in3Days = addDays(now, 3)
  const in4Days = addDays(now, 4)
  const in5Days = addDays(now, 5)

  const interestSet = new Set(profile.interests)
  const pool: EventSuggestion[] = []

  if (interestSet.has("tech") || interestSet.has("ai") || interestSet.has("entrepreneurship")) {
    pool.push(
      makeSuggestion({
        id: "fallback-ai-mixer",
        title: "NYC AI Founders Mixer",
        description: "Casual networking with early-stage AI founders.",
        location: "Soho House, 29-35 9th Ave",
        start: setHour(tomorrow, 19),
        end: setHour(tomorrow, 22),
        source: "Eventbrite",
        category: "Networking",
        tags: ["ai", "tech", "networking"],
        matchScore: 94,
        matchReason: "Matches your AI and entrepreneurship interests",
        reasoning: [
          "Backend offline — showing fallback recommendations",
          "Matches AI + entrepreneurship",
        ],
      }),
    )
  }
  if (interestSet.has("finance")) {
    pool.push(
      makeSuggestion({
        id: "fallback-stern-ib",
        title: "Stern IB Recruiting Panel",
        description: "Goldman, JPM, Evercore VPs talk Summer 2026 IB recruiting.",
        location: "NYU Stern KMC 2-60",
        start: setHour(dayAfter, 18),
        end: setHour(dayAfter, 20),
        source: "Career Center",
        category: "Career",
        tags: ["finance", "career"],
        matchScore: 96,
        matchReason: "Backend offline — fallback fit for IB Summer 2026",
        reasoning: ["Backend offline", "Direct fit for finance interest"],
      }),
    )
  }
  if (pool.length === 0) {
    pool.push(
      makeSuggestion({
        id: "fallback-openmic",
        title: "Washington Square Park Open Mic",
        description: "Weekly community open mic.",
        location: "Washington Square Park",
        start: setHour(tomorrow, 17),
        end: setHour(tomorrow, 19),
        source: "Newsletter",
        category: "Community",
        tags: ["community"],
        matchScore: 60,
        matchReason: "Backend offline — fallback local pick",
        reasoning: ["Backend offline"],
      }),
    )
  }
  return pool
    .filter((s) => !conflictsWithCalendar(s.event, calendar))
    .sort((a, b) => b.matchScore - a.matchScore)
}

// ----------------- helpers -----------------

interface MockSeed {
  id: string
  title: string
  description: string
  location: string
  start: Date
  end: Date
  source: EventSource
  category: string
  tags: string[]
  matchScore: number
  matchReason: string
  reasoning: string[]
}

function makeSuggestion(seed: MockSeed): EventSuggestion {
  const event: AvailableEvent = {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    location: seed.location,
    startTime: seed.start,
    endTime: seed.end,
    source: seed.source,
    category: seed.category,
    tags: seed.tags,
  }
  return {
    event,
    matchScore: seed.matchScore,
    matchReason: seed.matchReason,
    reasoning: seed.reasoning,
  }
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000)
}

function setHour(d: Date, hour: number): Date {
  const next = new Date(d)
  next.setHours(hour, 0, 0, 0)
  return next
}

function conflictsWithCalendar(
  evt: AvailableEvent,
  calendar: CalendarEvent[],
): boolean {
  const sStart = evt.startTime.getTime()
  const sEnd = evt.endTime.getTime()
  return calendar.some((c) => {
    const cStart = new Date(c.startTime).getTime()
    const cEnd = new Date(c.endTime).getTime()
    return sStart < cEnd && sEnd > cStart
  })
}
