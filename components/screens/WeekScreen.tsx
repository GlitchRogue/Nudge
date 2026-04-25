"use client"

import { useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { availableEvents, getEventsForDay } from '@/lib/mock'
import { useProfile } from '@/lib/profile-store'
import { rankByMatch } from '@/lib/scoring'
import { SuggestionCard } from '@/components/SuggestionCard'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeekScreen() {
  const today = new Date().getDay()
  const [selected, setSelected] = useState(today)
  const { interests } = useProfile()

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), [])
  const dayEvents = useMemo(
    () => rankByMatch(getEventsForDay(availableEvents as never, selected) as never, interests),
    [selected, interests]
  )

  return (
    <>
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {DAY_LABELS.map((d, i) => {
          const date = addDays(weekStart, i)
          const has = (getEventsForDay(availableEvents as never, i) as never[]).length > 0
          const active = selected === i
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelected(i)}
              className={`py-2 rounded-xl border text-center transition ${active ? 'bg-brand border-brand text-white' : 'bg-app-card border-app-border-strong text-app-text'}`}
            >
              <div className={`text-[11px] ${active ? 'opacity-85' : 'text-app-muted'}`}>{d}</div>
              <div className="text-[16px] font-medium mt-0.5">{format(date, 'd')}</div>
              {has && <div className={`w-1 h-1 rounded-full mx-auto mt-1 ${active ? 'bg-white' : 'bg-brand'}`} />}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-app-muted tracking-[0.08em] font-medium mb-3">
        {DAY_LABELS[selected].toUpperCase()} {format(addDays(weekStart, selected), 'MMM d')} · {dayEvents.length} EVENT{dayEvents.length === 1 ? '' : 'S'}
      </p>
      {dayEvents.length === 0 && <p className="text-center text-app-muted py-10 text-[13px]">Nothing scheduled yet</p>}
      {dayEvents.map(e => <SuggestionCard key={e.id} event={e} />)}
    </>
  )
}