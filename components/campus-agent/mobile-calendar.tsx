'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  eachDayOfInterval,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CalendarEvent, EventSuggestion } from '@/lib/mockData'

interface MobileCalendarProps {
  events: CalendarEvent[]
  suggestions: EventSuggestion[]
  addedEventIds: Set<string>
}

type ViewMode = 'day' | 'week' | 'month'

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6) // 6 AM to 9 PM

// Fixed reference date for SSR
const FIXED_REFERENCE_DATE = new Date('2026-04-20T12:00:00')

export function MobileCalendar({ events, suggestions, addedEventIds }: MobileCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [selectedDate, setSelectedDate] = useState(FIXED_REFERENCE_DATE)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setSelectedDate(new Date())
    setIsClient(true)
  }, [])

  // Navigation
  const goToPrevious = () => {
    if (viewMode === 'day') setSelectedDate(prev => subDays(prev, 1))
    else if (viewMode === 'week') setSelectedDate(prev => subWeeks(prev, 1))
    else setSelectedDate(prev => subMonths(prev, 1))
  }

  const goToNext = () => {
    if (viewMode === 'day') setSelectedDate(prev => addDays(prev, 1))
    else if (viewMode === 'week') setSelectedDate(prev => addWeeks(prev, 1))
    else setSelectedDate(prev => addMonths(prev, 1))
  }

  const goToToday = () => setSelectedDate(new Date())

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

  const pendingSuggestions = useMemo(() => {
    return suggestions.filter(s => !addedEventIds.has(s.event.id))
  }, [suggestions, addedEventIds])

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'suggested') {
      return 'border-2 border-dashed border-success bg-success/10 text-success'
    }
    switch (event.type) {
      case 'class':
        return 'bg-primary text-primary-foreground'
      case 'club':
        return 'bg-chart-2 text-white'
      case 'personal':
        return 'bg-chart-3 text-white'
      case 'work':
        return 'bg-chart-4 text-white'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getHeaderText = () => {
    if (viewMode === 'day') return format(selectedDate, 'EEEE, MMM d, yyyy')
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 6)
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    }
    return format(selectedDate, 'MMMM yyyy')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      {/* Header with navigation */}
      <div className="flex flex-col gap-2 border-b border-border bg-muted/30 p-3">
        {/* View mode tabs */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                viewMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm font-semibold text-foreground">{getHeaderText()}</span>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar content */}
      <div className="min-h-0 flex-1 overflow-auto">
        {viewMode === 'day' && (
          <DayView
            date={selectedDate}
            events={allEvents}
            pendingSuggestions={pendingSuggestions}
            getEventColor={getEventColor}
            isClient={isClient}
          />
        )}
        {viewMode === 'week' && (
          <WeekView
            selectedDate={selectedDate}
            events={allEvents}
            pendingSuggestions={pendingSuggestions}
            getEventColor={getEventColor}
            isClient={isClient}
            onDaySelect={(date) => {
              setSelectedDate(date)
              setViewMode('day')
            }}
          />
        )}
        {viewMode === 'month' && (
          <MonthView
            selectedDate={selectedDate}
            events={allEvents}
            pendingSuggestions={pendingSuggestions}
            isClient={isClient}
            onDaySelect={(date) => {
              setSelectedDate(date)
              setViewMode('day')
            }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
          <span className="text-[10px] text-muted-foreground">Class</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm border border-dashed border-success bg-success/20" />
          <span className="text-[10px] text-muted-foreground">Suggested</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-chart-2" />
          <span className="text-[10px] text-muted-foreground">Club</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-chart-3" />
          <span className="text-[10px] text-muted-foreground">Personal</span>
        </div>
      </div>
    </div>
  )
}

// Day View Component
function DayView({
  date,
  events,
  pendingSuggestions,
  getEventColor,
  isClient,
}: {
  date: Date
  events: CalendarEvent[]
  pendingSuggestions: EventSuggestion[]
  getEventColor: (event: CalendarEvent) => string
  isClient: boolean
}) {
  const dayEvents = events.filter(e => isSameDay(e.startTime, date))
  const daySuggestions = pendingSuggestions.filter(s => isSameDay(s.event.startTime, date))

  const getEventStyle = (startTime: Date, endTime: Date) => {
    const startHour = startTime.getHours() + startTime.getMinutes() / 60
    const endHour = endTime.getHours() + endTime.getMinutes() / 60
    const top = (startHour - 6) * 60 // 60px per hour
    const height = (endHour - startHour) * 60
    return { top: `${top}px`, height: `${Math.max(height, 30)}px` }
  }

  return (
    <div className="relative flex">
      {/* Time labels */}
      <div className="w-12 flex-shrink-0 border-r border-border">
        {HOURS.map((hour) => (
          <div key={hour} className="relative h-[60px]">
            <span className="absolute -top-2 right-2 text-[10px] text-muted-foreground">
              {hour === 12 ? '12p' : hour > 12 ? `${hour - 12}p` : `${hour}a`}
            </span>
          </div>
        ))}
      </div>

      {/* Events column */}
      <div className={cn('relative flex-1', isClient && isToday(date) && 'bg-primary/5')}>
        {/* Hour lines */}
        {HOURS.map((hour) => (
          <div key={hour} className="h-[60px] border-b border-border/40" />
        ))}

        {/* Events */}
        {dayEvents.map((event) => {
          const style = getEventStyle(event.startTime, event.endTime)
          return (
            <div
              key={event.id}
              className={cn(
                'absolute left-1 right-1 overflow-hidden rounded-md px-2 py-1',
                getEventColor(event)
              )}
              style={style}
            >
              <div className="truncate text-xs font-medium">{event.title}</div>
              <div className="truncate text-[10px] opacity-80">
                {format(event.startTime, 'h:mm a')} - {event.location}
              </div>
            </div>
          )
        })}

        {/* Pending suggestions */}
        {daySuggestions.map((s) => {
          const style = getEventStyle(s.event.startTime, s.event.endTime)
          return (
            <div
              key={s.event.id}
              className="absolute left-1 right-1 overflow-hidden rounded-md border-2 border-dashed border-success/60 bg-success/10 px-2 py-1"
              style={style}
            >
              <div className="truncate text-xs font-medium text-success">{s.event.title}</div>
              <div className="truncate text-[10px] text-success/70">
                {format(s.event.startTime, 'h:mm a')} - {s.event.location}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({
  selectedDate,
  events,
  pendingSuggestions,
  getEventColor,
  isClient,
  onDaySelect,
}: {
  selectedDate: Date
  events: CalendarEvent[]
  pendingSuggestions: EventSuggestion[]
  getEventColor: (event: CalendarEvent) => string
  isClient: boolean
  onDaySelect: (date: Date) => void
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="flex h-full flex-col">
      {/* Day headers */}
      <div className="flex border-b border-border bg-muted/20">
        {days.map((day) => {
          const dayEvents = events.filter(e => isSameDay(e.startTime, day))
          const daySuggestions = pendingSuggestions.filter(s => isSameDay(s.event.startTime, day))
          const hasEvents = dayEvents.length > 0 || daySuggestions.length > 0
          const isCurrent = isClient && isToday(day)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDaySelect(day)}
              className={cn(
                'flex flex-1 flex-col items-center py-2 transition-colors hover:bg-muted/50',
                isCurrent && 'bg-primary/10'
              )}
            >
              <span className="text-[10px] font-medium text-muted-foreground">
                {format(day, 'EEE')}
              </span>
              <span
                className={cn(
                  'mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                  isCurrent && 'bg-primary text-primary-foreground'
                )}
              >
                {format(day, 'd')}
              </span>
              {hasEvents && (
                <div className="mt-1 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-primary" />
                  ))}
                  {daySuggestions.slice(0, 2).map((_, i) => (
                    <div key={`s-${i}`} className="h-1 w-1 rounded-full bg-success" />
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Events list for the week */}
      <div className="flex-1 overflow-auto p-2">
        {days.map((day) => {
          const dayEvents = events.filter(e => isSameDay(e.startTime, day))
          const daySuggestions = pendingSuggestions.filter(s => isSameDay(s.event.startTime, day))

          if (dayEvents.length === 0 && daySuggestions.length === 0) return null

          return (
            <div key={day.toISOString()} className="mb-3">
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                {format(day, 'EEEE, MMM d')}
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={cn('rounded-md px-2.5 py-1.5', getEventColor(event))}
                  >
                    <div className="text-xs font-medium">{event.title}</div>
                    <div className="text-[10px] opacity-80">
                      {format(event.startTime, 'h:mm a')} - {event.location}
                    </div>
                  </div>
                ))}
                {daySuggestions.map((s) => (
                  <div
                    key={s.event.id}
                    className="rounded-md border-2 border-dashed border-success/60 bg-success/10 px-2.5 py-1.5"
                  >
                    <div className="text-xs font-medium text-success">{s.event.title}</div>
                    <div className="text-[10px] text-success/70">
                      {format(s.event.startTime, 'h:mm a')} - {s.event.location}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {days.every(day => {
          const dayEvents = events.filter(e => isSameDay(e.startTime, day))
          const daySuggestions = pendingSuggestions.filter(s => isSameDay(s.event.startTime, day))
          return dayEvents.length === 0 && daySuggestions.length === 0
        }) && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No events this week
          </div>
        )}
      </div>
    </div>
  )
}

// Month View Component
function MonthView({
  selectedDate,
  events,
  pendingSuggestions,
  isClient,
  onDaySelect,
}: {
  selectedDate: Date
  events: CalendarEvent[]
  pendingSuggestions: EventSuggestion[]
  isClient: boolean
  onDaySelect: (date: Date) => void
}) {
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = addDays(startOfWeek(monthEnd, { weekStartsOn: 0 }), 6)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weeks = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className="flex h-full flex-col p-2">
      {/* Day headers */}
      <div className="mb-1 flex">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="flex-1 py-1 text-center text-[10px] font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-1 flex-col">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-1">
            {week.map((day) => {
              const dayEvents = events.filter(e => isSameDay(e.startTime, day))
              const daySuggestions = pendingSuggestions.filter(s =>
                isSameDay(s.event.startTime, day)
              )
              const isCurrentMonth = isSameMonth(day, selectedDate)
              const isCurrent = isClient && isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => onDaySelect(day)}
                  className={cn(
                    'flex flex-1 flex-col items-center border-b border-r border-border/30 p-1 transition-colors hover:bg-muted/50',
                    !isCurrentMonth && 'opacity-40',
                    isCurrent && 'bg-primary/10'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isCurrent && 'bg-primary text-primary-foreground font-semibold'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {/* Event indicators */}
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                    {dayEvents.slice(0, 2).map((event, i) => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          event.type === 'class' && 'bg-primary',
                          event.type === 'club' && 'bg-chart-2',
                          event.type === 'personal' && 'bg-chart-3',
                          event.type === 'work' && 'bg-chart-4',
                          event.type === 'suggested' && 'bg-success'
                        )}
                      />
                    ))}
                    {daySuggestions.slice(0, 2).map((_, i) => (
                      <div key={`s-${i}`} className="h-1.5 w-1.5 rounded-full border border-success bg-success/30" />
                    ))}
                    {dayEvents.length + daySuggestions.length > 4 && (
                      <span className="text-[8px] text-muted-foreground">+</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
