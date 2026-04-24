'use client'

import { useMemo } from 'react'
import { addDays, startOfWeek, format, isSameDay, isToday } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarEvent, EventSuggestion } from '@/lib/mockData'

interface WeekCalendarProps {
  events: CalendarEvent[]
  suggestions: EventSuggestion[]
  addedEventIds: Set<string>
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7 AM to 8 PM
const DAYS = Array.from({ length: 7 }, (_, i) => i) // Sun to Sat

export function WeekCalendar({ events, suggestions, addedEventIds }: WeekCalendarProps) {
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), [])

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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex border-b border-border bg-muted/30">
        <div className="w-14 flex-shrink-0" />
        {DAYS.map((dayOffset) => {
          const date = addDays(weekStart, dayOffset)
          const isCurrentDay = isToday(date)
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
                {format(new Date().setHours(hour, 0), 'h a')}
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
                  isToday(date) && 'bg-primary/5'
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
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded border-2 border-dashed border-success/60 bg-success/5 px-1 py-0.5 text-xs"
                      style={style}
                    >
                      <div className="truncate font-medium text-success">{suggestion.event.title}</div>
                      <div className="truncate text-success/70">{suggestion.event.location}</div>
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
