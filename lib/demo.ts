import type { NudgeProfile } from "./profile"

/**
 * Demo mode bypass.
 *
 * When any page is loaded with ?demo=1 in the URL, we skip auth checks
 * and serve a fully-populated UI using mock user + profile data. This is
 * for v0's preview pane (which has no auth secrets) and screenshot demos.
 *
 * Production users never hit this code path because they don't pass
 * ?demo=1 — the home page renders the real auth flow.
 */
export function isDemoMode(searchParams: { demo?: string }): boolean {
  return searchParams.demo === "1"
}

export const DEMO_USER = {
  name: "Alex Chen",
  email: "demo@nudge.app",
  image:
    "https://api.dicebear.com/9.x/avataaars/svg?seed=Alex&backgroundColor=b6e3f4",
}

export const DEMO_PROFILE: NudgeProfile = {
  email: "demo@nudge.app",
  interests: ["tech", "ai", "finance", "entrepreneurship", "music", "networking"],
  bio: "NYU sophomore, recruiting for IB Summer 2026, building a side project on the weekends.",
  createdAt: new Date().toISOString(),
}
