'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  addDays,
  startOfWeek,
  format,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarEvent, EventSuggestion } from '@/lib/mockData'

interface MobileCalendarProps {
  events: CalendarEvent[]
  suggestions: EventSuggestion[]
  addedEventIds: Set<string>
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Fixed reference date for SSR
const FIXED_REFERENCE_DATE = new Date('2026-04-20T12:00:00')

export function MobileCalendar({ events, suggestions, addedEventIds }: MobileCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [isClient, setIsClient] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    setSelectedDay(new Date().getDay())
    setIsClient(true)
  }, [])

  const weekStart = useMemo(() => {
    const base = startOfWeek(isClient ? new Date() : FIXED_REFERENCE_DATE, { weekStartsOn: 0 })
    return addWeeks(base, weekOffset)
  }, [isClient, weekOffset])

  // Combine events with added suggestions
  const allEvents = useMemo(() => {
    const suggestedEvents: CalendarEvent[] = suggestions
      .filter(s => addedEventIds.has(s.event.id))
      .map(s => ({
        id: s.event.id,
        title: s.event.title,
        location: s.event.location,
        startTime: s.event.startTime,
        endTime: s.event.endTime,
        type: 'suggested' as const,
        priority: 'medium' as const,
      }))
    return [...events, ...suggestedEvents]
  }, [events, suggestions, addedEventIds])

  // Get events for selected day
  const selectedDate = addDays(weekStart, selectedDay)
  const dayEvents = useMemo(() => {
    return allEvents.filter(e => isSameDay(e.startTime, selectedDate))
  }, [allEvents, selectedDate])

  const pendingSuggestions = useMemo(() => {
    return suggestions.filter(s => !addedEventIds.has(s.event.id) && isSameDay(s.event.startTime, selectedDate))
  }, [suggestions, addedEventIds, selectedDate])

  // Check if a day has events
  const getDayHasEvents = (dayIndex: number) => {
    const date = addDays(weekStart, dayIndex)
    return allEvents.some(e => isSameDay(e.startTime, date)) ||
           suggestions.some(s => !addedEventIds.has(s.event.id) && isSameDay(s.event.startTime, date))
  }

  const weekEnd = addDays(weekStart, 6)
  const weekRangeLabel =
    format(weekStart, 'MMM') === format(weekEnd, 'MMM')
      ? `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd')}`
      : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`

  return (
    <div className="flex h-full flex-col">
      {/* Week navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface hover:text-app-text"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-app-text">{weekRangeLabel}</span>
          {weekOffset !== 0 && (
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="rounded-md border border-app-border-strong px-2 py-0.5 text-[11px] font-medium text-app-muted transition hover:bg-app-surface hover:text-app-text"
            >
              Today
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setWeekOffset((w) => w + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface hover:text-app-text"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Week selector */}
      <div className="mb-4 grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((d, i) => {
          const date = addDays(weekStart, i)
          const hasEvents = getDayHasEvents(i)
          const active = selectedDay === i
          const isCurrent = isClient && isToday(date)

          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(i)}
              className={cn(
                'rounded-xl border py-2 text-center transition',
                active 
                  ? 'border-brand bg-brand text-white' 
                  : 'border-app-border-strong bg-app-card text-app-text'
              )}
            >
              <div className={cn('text-[11px]', active ? 'opacity-85' : 'text-app-muted')}>
                {d}
              </div>
              <div className="mt-0.5 text-[16px] font-medium">{format(date, 'd')}</div>
              {hasEvents && (
                <div className={cn(
                  'mx-auto mt-1 h-1 w-1 rounded-full',
                  active ? 'bg-white' : 'bg-brand'
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Day header */}
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
        {DAY_LABELS[selectedDay].toUpperCase()} {format(selectedDate, 'MMM d')} · {dayEvents.length + pendingSuggestions.length} EVENT{dayEvents.length + pendingSuggestions.length === 1 ? '' : 'S'}
      </p>

      {/* Events list */}
      <div className="min-h-0 flex-1 overflow-auto">
        {dayEvents.length === 0 && pendingSuggestions.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-app-muted">Nothing scheduled yet</p>
        ) : (
          <div className="space-y-2">
            {/* Regular events */}
            {dayEvents.map((event) => (
              <EventListItem 
                key={event.id} 
                event={event}
              />
            ))}
            
            {/* Pending suggestions */}
            {pendingSuggestions.map((s) => (
              <SuggestionListItem 
                key={s.event.id} 
                suggestion={s}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EventListItem({ event }: { event: CalendarEvent }) {
  const getEventColor = () => {
    switch (event.type) {
      case 'class': return '#2563EB'
      case 'club': return '#9333EA'
      case 'personal': return '#059669'
      case 'work': return '#EA580C'
      case 'suggested': return '#0F6E56'
      default: return '#6B7280'
    }
  }

  const color = getEventColor()

  return (
    <article className="overflow-hidden rounded-2xl border border-app-border bg-app-card">
      <div className="h-1" style={{ background: color }} />
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <span 
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em]"
            style={{ color }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: color }} />
            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
          </span>
          <span className="text-[12px] font-medium text-app-muted">
            {format(event.startTime, 'h:mm a')}
          </span>
        </div>
        <h3 className="mb-1 mt-2 text-[15.5px] font-medium leading-snug text-app-text">
          {event.title}
        </h3>
        <p className="text-[12.5px] text-app-muted">
          {event.location}
        </p>
      </div>
    </article>
  )
}

function SuggestionListItem({ suggestion }: { suggestion: EventSuggestion }) {
  const { event, matchScore } = suggestion

  return (
    <article className="overflow-hidden rounded-2xl border-2 border-dashed border-brand/50 bg-brand-bg">
      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em] text-brand">
            <span className="h-[7px] w-[7px] rounded-full bg-brand" />
            Suggested
          </span>
          <span className="text-[12px] font-medium text-brand">
            {matchScore}% match
          </span>
        </div>
        <h3 className="mb-1 mt-2 text-[15.5px] font-medium leading-snug text-app-text">
          {event.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-[12.5px] text-app-muted">
            {format(event.startTime, 'h:mm a')} · {event.location}
          </p>
          <button 
            type="button"
            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-medium text-white"
          >
            Add
          </button>
        </div>
      </div>
    </article>
  )
}
