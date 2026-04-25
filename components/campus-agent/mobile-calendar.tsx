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
  onAddToCalendar?: (eventId: string) => void
  jumpToDate?: Date | null
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Fixed reference date for SSR
const FIXED_REFERENCE_DATE = new Date('2026-04-20T12:00:00')

export function MobileCalendar({ events, suggestions, addedEventIds, onAddToCalendar, jumpToDate }: MobileCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay())
  const [isClient, setIsClient] = useState(false)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    setSelectedDay(new Date().getDay())
    setIsClient(true)
  }, [])

  // Jump to the week + day of newly added event
  useEffect(() => {
    if (jumpToDate) {
      const target = new Date(jumpToDate)
      const today = new Date()
      const todayWeekStart = startOfWeek(today, { weekStartsOn: 0 })
      const targetWeekStart = startOfWeek(target, { weekStartsOn: 0 })
      const diffWeeks = Math.round(
        (targetWeekStart.getTime() - todayWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000),
      )
      console.log('[MobileCalendar] jumping to', target, 'weekOffset:', diffWeeks)
      setWeekOffset(diffWeeks)
      setSelectedDay(target.getDay())
    }
  }, [jumpToDate])

  const weekStart = useMemo(() => {
    const base = startOfWeek(isClient ? new Date() : FIXED_REFERENCE_DATE, { weekStartsOn: 0 })
    return addWeeks(base, weekOffset)
  }, [isClient, weekOffset])

  // Real events only — suggestions kept separate so we keep url + toggle
  const allEvents = useMemo(() => events, [events])

  // Get events for selected day
  const selectedDate = addDays(weekStart, selectedDay)
  const dayEvents = useMemo(() => {
    return allEvents.filter(e => isSameDay(e.startTime, selectedDate))
  }, [allEvents, selectedDate])

  // ALL suggestions for the day (added + pending)
  const pendingSuggestions = useMemo(() => {
    return suggestions.filter(s => isSameDay(s.event.startTime, selectedDate))
  }, [suggestions, selectedDate])

  // Check if a day has events
  const getDayHasEvents = (dayIndex: number) => {
    const date = addDays(weekStart, dayIndex)
    return allEvents.some(e => isSameDay(e.startTime, date)) ||
           suggestions.some(s => isSameDay(s.event.startTime, date))
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
                isAdded={addedEventIds.has(s.event.id)}
                onAdd={onAddToCalendar}
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

function SuggestionListItem({ suggestion, isAdded, onAdd }: { suggestion: EventSuggestion; isAdded: boolean; onAdd?: (id: string) => void }) {
  const { event, matchScore } = suggestion

  return (
    <article className={cn(
      'overflow-hidden rounded-2xl',
      isAdded
        ? 'border-2 border-brand bg-brand/10 ring-2 ring-brand/30'
        : 'border-2 border-dashed border-brand/50 bg-brand-bg'
    )}>
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
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 mt-2 block text-[15.5px] font-medium leading-snug text-app-text underline-offset-2 hover:underline"
          >
            {event.title} ↗
          </a>
        ) : (
          <h3 className="mb-1 mt-2 text-[15.5px] font-medium leading-snug text-app-text">
            {event.title}
          </h3>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12.5px] text-app-muted">
            {format(event.startTime, 'h:mm a')} · {event.location}
          </p>
          <button
            type="button"
            onClick={() => onAdd?.(event.id)}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-medium transition hover:opacity-90 active:scale-95',
              isAdded
                ? 'border border-brand bg-white text-brand'
                : 'bg-brand text-white'
            )}
          >
            {isAdded ? '✓ Added' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  )
}
