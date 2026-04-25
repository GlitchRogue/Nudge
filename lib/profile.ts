import { cookies } from "next/headers"

export interface NudgeProfile {
  email: string
  interests: string[]
  bio: string
  createdAt: string
}

const COOKIE_NAME = "nudge_profile"

/**
 * Read the current user's profile from cookies (server-side).
 * Returns null if no profile exists yet (i.e. user hasn't onboarded).
 */
export async function getProfile(): Promise<NudgeProfile | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as NudgeProfile
  } catch {
    return null
  }
}

/**
 * Persist a user profile to cookies. Cookie lasts 1 year.
 * Server-side only (uses next/headers cookies()).
 */
export async function saveProfile(profile: NudgeProfile): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, JSON.stringify(profile), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
}

/**
 * Clear the profile cookie (e.g. on sign-out or "redo onboarding").
 */
export async function clearProfile(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Curated list of interest tags shown on the onboarding page.
 * Edit freely — these are just defaults.
 */
export const INTEREST_OPTIONS: { id: string; label: string; emoji: string }[] = [
  { id: "tech", label: "Tech & Startups", emoji: "💻" },
  { id: "ai", label: "AI & ML", emoji: "🤖" },
  { id: "finance", label: "Finance & Investing", emoji: "📈" },
  { id: "entrepreneurship", label: "Entrepreneurship", emoji: "🚀" },
  { id: "design", label: "Design", emoji: "🎨" },
  { id: "music", label: "Music & Concerts", emoji: "🎵" },
  { id: "art", label: "Art & Museums", emoji: "🖼️" },
  { id: "food", label: "Food & Dining", emoji: "🍜" },
  { id: "fitness", label: "Fitness & Sports", emoji: "💪" },
  { id: "outdoors", label: "Outdoors", emoji: "🌳" },
  { id: "academic", label: "Academic Talks", emoji: "🎓" },
  { id: "research", label: "Research", emoji: "🔬" },
  { id: "policy", label: "Policy & Politics", emoji: "🏛️" },
  { id: "writing", label: "Writing", emoji: "✍️" },
  { id: "film", label: "Film & TV", emoji: "🎬" },
  { id: "gaming", label: "Gaming", emoji: "🎮" },
  { id: "networking", label: "Networking", emoji: "🤝" },
  { id: "volunteering", label: "Volunteering", emoji: "💛" },
  { id: "religion", label: "Faith & Spirituality", emoji: "🙏" },
  { id: "social", label: "Parties & Social", emoji: "🎉" },
]
