'use client'

import { useMemo, useState, useEffect } from 'react'
import { addDays, startOfWeek, format, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CalendarEvent, EventSuggestion } from '@/lib/mockData'

interface WeekCalendarProps {
  events: CalendarEvent[]
  suggestions: EventSuggestion[]
  addedEventIds: Set<string>
  onAddToCalendar?: (eventId: string) => void
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM
const DAYS = Array.from({ length: 7 }, (_, i) => i) // Sun to Sat

// Use a fixed reference date for SSR to avoid hydration mismatches
const FIXED_REFERENCE_DATE = new Date('2026-04-20T12:00:00')

export function WeekCalendar({ events, suggestions, addedEventIds, onAddToCalendar }: WeekCalendarProps) {
  // Start with fixed date for SSR, then update to real date on client
  const [currentDate, setCurrentDate] = useState(FIXED_REFERENCE_DATE)
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setCurrentDate(new Date())
    setIsClient(true)
  }, [])
  
  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate])

  const getEventStyle = (startTime: Date, endTime: Date) => {
    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const endHour = endTime.getHours() + endTime.getMinutes() / 60
    const top = (startHour - 7) * 48 // 48px per hour
    const height = (endHour - startHour) * 48
    return { top: `${top}px`, height: `${Math.max(height, 24)}px` }
  }

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'suggested') {
      return 'border-2 border-dashed border-success bg-success/10 text-success'
    }
    switch (event.type) {
      case 'class':
        return 'bg-primary/80 text-primary-foreground'
      case 'club':
        return 'bg-chart-2/80 text-white'
      case 'personal':
        return 'bg-chart-3/80 text-white'
      case 'work':
        return 'bg-chart-4/80 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  // Combine regular events with added suggestions
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

  // Also show non-added suggestions as dashed outlines
  const pendingSuggestions = useMemo(() => {
    return suggestions.filter(s => !addedEventIds.has(s.event.id))
  }, [suggestions, addedEventIds])

  const weekEnd = addDays(weekStart, 6)
  const weekRangeLabel =
    format(weekStart, 'MMM') === format(weekEnd, 'MMM')
      ? `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'd, yyyy')}`
      : `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Week navigation toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <button
          type="button"
          onClick={() => setCurrentDate((d) => subWeeks(d, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface hover:text-app-text"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-app-text">{weekRangeLabel}</span>
          {isClient && (
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="rounded-md border border-app-border-strong px-2 py-0.5 text-[10.5px] font-medium text-app-muted transition hover:bg-app-surface hover:text-app-text"
            >
              Today
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCurrentDate((d) => addWeeks(d, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface hover:text-app-text"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="flex border-b border-border bg-muted/30">
        <div className="w-14 flex-shrink-0" />
        {DAYS.map((dayOffset) => {
          const date = addDays(weekStart, dayOffset)
          // Only highlight today after client hydration
          const isCurrentDay = isClient && isToday(date)
          return (
            <div
              key={dayOffset}
              className={cn(
                'flex-1 py-2 text-center border-l border-border first:border-l-0',
                isCurrentDay && 'bg-primary/5'
              )}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {format(date, 'EEE')}
              </div>
              <div className={cn(
                'mt-0.5 text-sm font-semibold',
                isCurrentDay ? 'text-primary' : 'text-foreground'
              )}>
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time Grid */}
      <div className="flex flex-1 overflow-auto">
        {/* Time labels */}
        <div className="w-14 flex-shrink-0">
          {HOURS.map((hour) => (
            <div key={hour} className="relative h-12">
              <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex flex-1">
          {DAYS.map((dayOffset) => {
            const date = addDays(weekStart, dayOffset)
            const dayEvents = allEvents.filter(e => isSameDay(e.startTime, date))
            const daySuggestions = pendingSuggestions.filter(s => 
              isSameDay(s.event.startTime, date)
            )

            return (
              <div
                key={dayOffset}
                className={cn(
                  'relative flex-1 border-l border-border first:border-l-0',
                  isClient && isToday(date) && 'bg-primary/5'
                )}
              >
                {/* Hour lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b border-border/50"
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const style = getEventStyle(event.startTime, event.endTime)
                  return (
                    <div
                      key={event.id}
                      className={cn(
                        'absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-xs',
                        getEventColor(event)
                      )}
                      style={style}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                      <div className="truncate opacity-80">{event.location}</div>
                    </div>
                  )
                })}

                {/* Pending suggestions (dashed) */}
                {daySuggestions.map((suggestion) => {
                  const style = getEventStyle(suggestion.event.startTime, suggestion.event.endTime)
                  return (
                    <div
                      key={suggestion.event.id}
                      className="group absolute left-0.5 right-0.5 overflow-hidden rounded border-2 border-dashed border-success/60 bg-success/5 px-1 py-0.5 text-xs"
                      style={style}
                    >
                      <div className="truncate font-medium text-success">{suggestion.event.title}</div>
                      <div className="truncate text-success/70">{suggestion.event.location}</div>
                      {onAddToCalendar && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onAddToCalendar(suggestion.event.id) }}
                          className="absolute right-0.5 top-0.5 rounded bg-success px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm transition hover:opacity-90 active:scale-95"
                          aria-label="Add to calendar"
                        >
                          + Add
                        </button>
                      )}
                      {suggestion.event.url && (
                        <a
                          href={suggestion.event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-0.5 right-0.5 rounded bg-white/80 px-1 py-0.5 text-[9px] font-medium text-success underline-offset-2 hover:underline"
                        >
                          link ↗
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-border bg-muted/30 px-4 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-primary/80" />
          <span className="text-xs text-muted-foreground">Classes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border-2 border-dashed border-success bg-success/10" />
          <span className="text-xs text-muted-foreground">Suggested</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-chart-2/80" />
          <span className="text-xs text-muted-foreground">Clubs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-chart-3/80" />
          <span className="text-xs text-muted-foreground">Personal</span>
        </div>
      </div>
    </div>
  )
}
