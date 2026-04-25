/**
 * EventPilot API client.
 *
 * All requests go to NEXT_PUBLIC_API_URL (e.g. https://nudge-api-xxxx.onrender.com)
 * with `credentials: 'include'` so the FastAPI session cookie is sent and
 * received cross-origin.
 */

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

// ---- Response shapes (mirror api/app/schemas.py) ----

export interface BackendEvent {
  id: string
  source: string
  title: string
  description: string
  start_time: string
  end_time: string
  location_text: string
  url?: string
  cost: number
  rsvp_count?: number
  tags: string[]
}

export interface RankedEvent {
  event: BackendEvent
  score: number
  signals: {
    fit: number
    interest: number
    location: number
    cost: number
  }
  reason: string
  conflict: boolean
}

export interface BackendUser {
  id: number
  email: string
  name?: string
  interests: string[]
  connected_google: boolean
}

export interface AgentDraft {
  event: BackendEvent
  proposed_start: string
  proposed_end: string
  travel_minutes: number
  reasoning: string
}

// ---- Generic helper ----

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`API ${path} ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json()
}

// ---- Auth ----

export const apiAuth = {
  /** One-click demo login. Sets a session cookie. */
  demo: () => api<{ ok: boolean; user: BackendUser }>("/auth/demo"),

  /** Build the URL the user gets redirected to for real Google OAuth */
  googleSignInUrl: () => `${API_URL}/auth/google`,

  /** Clear the session */
  logout: () => api<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  /** Get current user (or 401 if not signed in) */
  me: () => api<BackendUser>("/user/me"),
}

// ---- Events feed ----

export const apiEvents = {
  /** Fetch ranked event feed */
  list: (source?: string) => {
    const qs = source ? `?source=${encodeURIComponent(source)}` : ""
    return api<RankedEvent[]>(`/events${qs}`)
  },
}

// ---- User actions ----

export type ActionType =
  | "rsvp"
  | "save"
  | "dismiss"
  | "add_to_calendar"
  | "approved"

export const apiActions = {
  /** Record an action; backend writes to Google Calendar if applicable */
  record: (event_id: string, action_type: ActionType, note?: string) =>
    api<{ ok: boolean }>("/actions", {
      method: "POST",
      body: JSON.stringify({ event_id, action_type, note }),
    }),
}

// ---- Agent ----

export const apiAgent = {
  /** Get the top non-conflicting suggestion the agent wants to add */
  draft: () => api<AgentDraft>("/agent/draft"),

  /** Approve the drafted suggestion (writes to Calendar if connected) */
  approve: () => api<{ ok: boolean }>("/agent/approve", { method: "POST" }),
}

// ---- User profile ----

export const apiUser = {
  setInterests: (interests: string[]) =>
    api<BackendUser>("/user/interests", {
      method: "POST",
      body: JSON.stringify({ interests }),
    }),
}
