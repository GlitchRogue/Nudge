import type { AvailableEvent } from './mock'

function tokens(s: string): string[] {
  return s.toLowerCase().split(/[\s/,&-]+/).filter(t => t.length > 1)
}

export function scoreEvent(event: AvailableEvent, userInterests: string[]): number | null {
  if (event.tags.length === 0) return null
  if (userInterests.length === 0) return null

  const userTokens = new Set(userInterests.flatMap(tokens))
  const matched = event.tags.filter(tag =>
    tokens(tag).some(t => userTokens.has(t))
  ).length

  return Math.round((matched / event.tags.length) * 100)
}

export function rankByMatch(events: AvailableEvent[], userInterests: string[]): AvailableEvent[] {
  return [...events].sort((a, b) => {
    const sa = scoreEvent(a, userInterests)
    const sb = scoreEvent(b, userInterests)
    return ((sb ?? 50) - (sa ?? 50))
  })
}

export function inSlot(event: AvailableEvent, slot: { start: Date; end: Date }): boolean {
  return event.startTime >= slot.start && event.startTime < slot.end
}