import type {
  CalendarEvent,
  EventSuggestion,
  AvailableEvent,
  EventSource,
} from "./mock"
import type { NudgeProfile } from "./profile"

/**
 * ============================================================
 *  TEAMMATE INTEGRATION POINT
 * ============================================================
 *
 *  Replace the body of `searchEvents()` below with a call to your
 *  Claude + real-events API code. The UI already consumes
 *  EventSuggestion[] — you don't need to touch any UI code.
 *
 *  INPUT:
 *    profile.interests : string[]   e.g. ["tech", "ai", "finance"]
 *    profile.bio       : string     free-text from onboarding
 *    calendar          : CalendarEvent[]   user's existing events
 *
 *  OUTPUT: EventSuggestion[] where each item is:
 *    {
 *      event: {
 *        id, title, description, location,
 *        startTime: Date, endTime: Date,
 *        source: 'Eventbrite' | 'Campus Portal' | 'Career Center' | 'Newsletter',
 *        category: string, tags: string[],
 *      },
 *      matchScore: number     0-100, higher = better fit
 *      matchReason: string    one-line why this matches
 *      reasoning: string[]    bullets explaining the recommendation
 *    }
 *
 *  CONSTRAINTS:
 *    - Filter out events that overlap with `calendar` busy times.
 *    - Rank by relevance to interests + bio.
 *    - Return 5-10 results.
 * ============================================================
 */
export async function searchEvents(
  profile: NudgeProfile,
  calendar: CalendarEvent[],
): Promise<EventSuggestion[]> {
  // === MOCK IMPLEMENTATION (replace when teammate wires real API) ===
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
        id: "mock-ai-mixer",
        title: "NYC AI Founders Mixer",
        description:
          "Casual networking with early-stage AI founders. OpenAI, Anthropic, and DeepMind alumni confirmed.",
        location: "Soho House, 29-35 9th Ave",
        start: setHour(tomorrow, 19),
        end: setHour(tomorrow, 22),
        source: "Eventbrite",
        category: "Networking",
        tags: ["ai", "tech", "networking"],
        matchScore: 94,
        matchReason: "Matches your AI and entrepreneurship interests",
        reasoning: [
          "You picked AI and entrepreneurship as top interests",
          "Evening event — won't conflict with classes",
          "High-signal networking for early-career builders",
        ],
      }),
    )
  }
  if (interestSet.has("finance")) {
    pool.push(
      makeSuggestion({
        id: "mock-stern-ib",
        title: "Stern Investment Banking Panel",
        description:
          "Goldman, JPM, and Evercore VPs talk Summer 2026 IB recruiting and what gets resumes pulled.",
        location: "NYU Stern KMC 2-60",
        start: setHour(dayAfter, 18),
        end: setHour(dayAfter, 20),
        source: "Career Center",
        category: "Career",
        tags: ["finance", "career", "ib"],
        matchScore: 96,
        matchReason: "Perfect for IB Summer 2026 recruiting",
        reasoning: [
          "Direct fit for your finance interest",
          "Focused on Summer 2026 IB internships",
          "On-campus, easy to attend",
        ],
      }),
    )
  }
  if (interestSet.has("music")) {
    pool.push(
      makeSuggestion({
        id: "mock-vw",
        title: "Vampire Weekend at Webster Hall",
        description: "Surprise NYC show. Limited tickets remaining.",
        location: "Webster Hall, 125 E 11th St",
        start: setHour(in3Days, 20),
        end: setHour(in3Days, 23),
        source: "Eventbrite",
        category: "Music",
        tags: ["music", "concert", "nyc"],
        matchScore: 82,
        matchReason: "Walking distance from NYU + matches your music interest",
        reasoning: [
          "You picked music as an interest",
          "5-min walk from Bobst",
          "Tickets selling fast",
        ],
      }),
    )
  }
  if (interestSet.has("food")) {
    pool.push(
      makeSuggestion({
        id: "mock-smorg",
        title: "Smorgasburg Williamsburg",
        description: "100+ NYC food vendors. Try the Ramen Burger and Big Mozz.",
        location: "90 Kent Ave, Brooklyn",
        start: setHour(in4Days, 11),
        end: setHour(in4Days, 18),
        source: "Eventbrite",
        category: "Food",
        tags: ["food", "weekend"],
        matchScore: 70,
        matchReason: "Open-format weekend event you can drop into",
        reasoning: [
          "Matches your food interest",
          "Drop-in format — no commitment",
          "Saturday afternoon, free time",
        ],
      }),
    )
  }
  if (interestSet.has("networking") || interestSet.has("entrepreneurship")) {
    pool.push(
      makeSuggestion({
        id: "mock-coffee",
        title: "Cornell Tech x NYU Founders Coffee",
        description: "Open coffee chat for student founders. No pitch, just hang.",
        location: "Think Coffee, 248 Mercer St",
        start: setHour(tomorrow, 10),
        end: setHour(tomorrow, 12),
        source: "Newsletter",
        category: "Networking",
        tags: ["entrepreneurship", "networking", "students"],
        matchScore: 78,
        matchReason: "Casual networking that fits your morning",
        reasoning: [
          "Matches networking + entrepreneurship interests",
          "2-min walk from Stern",
          "Drop-in style — leave when you want",
        ],
      }),
    )
  }
  if (interestSet.has("academic") || interestSet.has("research")) {
    pool.push(
      makeSuggestion({
        id: "mock-courant",
        title: "Courant Institute AI Safety Talk",
        description:
          "Anthropic researcher on alignment evaluations. Q&A and reception after.",
        location: "Courant Institute, 251 Mercer St",
        start: setHour(in5Days, 16),
        end: setHour(in5Days, 18),
        source: "Campus Portal",
        category: "Academic",
        tags: ["ai", "research", "talk"],
        matchScore: 88,
        matchReason: "Research + AI overlap",
        reasoning: [
          "You picked academic talks and research",
          "On-campus and free",
          "Reception is great for 1:1s with the speaker",
        ],
      }),
    )
  }

  // Generic fallback if interests didn't hit any bucket
  if (pool.length === 0) {
    pool.push(
      makeSuggestion({
        id: "mock-fallback-openmic",
        title: "Washington Square Park Open Mic",
        description: "Weekly community open mic. Show up, listen, or perform.",
        location: "Washington Square Park",
        start: setHour(tomorrow, 17),
        end: setHour(tomorrow, 19),
        source: "Newsletter",
        category: "Community",
        tags: ["community", "outdoors"],
        matchScore: 60,
        matchReason: "Low-commitment local pick while we learn more about you",
        reasoning: [
          "Free, open to all",
          "5-min walk from anywhere on campus",
          "Update your interests on /profile for better picks",
        ],
      }),
    )
  }

  // Drop anything that overlaps with the user's existing calendar
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
