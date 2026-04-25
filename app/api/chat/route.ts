/**
 * Chat endpoint — proxies to the FastAPI backend's /agent/chat (Claude Haiku).
 *
 * Why proxy instead of calling Anthropic directly from Vercel?
 *   - The Anthropic key is already configured on Render (backend) — single source of truth.
 *   - The backend has the user's profile + ranked events in DB, so it builds richer context.
 *   - Avoids needing an AI key env var on Vercel.
 *
 * The frontend posts { messages: [{role, content}, ...] } and gets back
 * { reply: string, suggested_event_ids: string[] }.
 */
import { NextResponse } from 'next/server'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const maxDuration = 30

export async function POST(req: Request) {
  let body: { messages?: Array<{ role: string; content: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const messages = body.messages ?? []
  if (messages.length === 0) {
    return NextResponse.json({ error: 'messages required' }, { status: 400 })
  }

  // Pull the session cookie forwarded from the browser so the backend
  // recognises the user. Falls back to /auth/demo if there's no session.
  const incomingCookie = req.headers.get('cookie') ?? ''

  async function callChat(cookie: string) {
    return fetch(`${API_URL}/agent/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie,
      },
      body: JSON.stringify({ messages }),
    })
  }

  let r = await callChat(incomingCookie)

  if (r.status === 401) {
    // No backend session — silently mint a demo one and retry once.
    const demoR = await fetch(`${API_URL}/auth/demo`, { method: 'GET' })
    const demoCookie = demoR.headers.get('set-cookie') ?? ''
    r = await callChat(demoCookie)
  }

  if (!r.ok) {
    const text = await r.text().catch(() => '')
    console.error('[chat] backend error', r.status, text)
    return NextResponse.json(
      {
        reply:
          "I'm having trouble reaching the event database right now. Try again in a moment.",
        suggested_event_ids: [],
      },
      { status: 200 },
    )
  }

  const data = (await r.json()) as {
    reply: string
    suggested_event_ids: string[]
  }
  return NextResponse.json(data)
}
