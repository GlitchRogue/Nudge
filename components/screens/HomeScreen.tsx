"use client"

import { useEffect, useMemo, useState } from 'react'
import { isSameDay } from 'date-fns'
import { availableEvents } from '@/lib/mock'
import { useProfile } from '@/lib/profile-store'
import { rankByMatch, inSlot } from '@/lib/scoring'
import { getVisualTag } from '@/lib/tag-mapping'
import { getNextFreeSlot, type FreeSlot } from '@/lib/free-slots'
import { SuggestionCard } from '@/components/SuggestionCard'
import { FilterChips, type FilterValue } from '@/components/FilterChips'
import { FreeWindowCard } from '@/components/FreeWindowCard'

export function HomeScreen() {
  const [filter, setFilter] = useState<FilterValue>('all')
  const [slot, setSlot] = useState<FreeSlot | null>(null)
  const { interests } = useProfile()

  useEffect(() => {
    setSlot(getNextFreeSlot())
  }, [])

  const today = useMemo(() => {
    const now = new Date()
    return availableEvents.filter(e => isSameDay(e.startTime, now))
  }, [])

  const filtered = filter === 'all' ? today : today.filter(e => getVisualTag(e) === filter)

  const lunch = useMemo(
    () => slot ? rankByMatch(filtered.filter(e => inSlot(e, slot)), interests) : [],
    [filtered, interests, slot]
  )
  const later = useMemo(
    () => slot
      ? rankByMatch(filtered.filter(e => !inSlot(e, slot)), interests)
      : rankByMatch(filtered, interests),
    [filtered, interests, slot]
  )

  return (
    <>
      <FreeWindowCard slot={slot} />
      <FilterChips value={filter} onChange={setFilter} />
      <p className="text-[11px] text-app-muted tracking-[0.08em] font-medium mb-3">
        SUGGESTED FOR YOUR FREE WINDOW
      </p>
      {slot && lunch.length === 0 && (
        <p className="text-center text-app-muted py-10 text-[13px]">No events match this filter</p>
      )}
      {lunch.map(e => <SuggestionCard key={e.id} event={e} />)}
      {later.length > 0 && (
        <>
          <p className="text-[11px] text-app-muted tracking-[0.08em] font-medium mb-3 mt-5">
            LATER TODAY
          </p>
          {later.map(e => <SuggestionCard key={e.id} event={e} />)}
        </>
      )}
    </>
  )
}