import { format, isAfter, addHours } from 'date-fns'
import { calendarEvents } from './mock'

export interface FreeSlot {
  start: Date
  end: Date
  label: string
}

export function getNextFreeSlot(minHours = 2): FreeSlot {
  const now = new Date()
  const upcoming = calendarEvents
    .filter(e => isAfter(e.endTime, now))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  let cursor = now
  for (const event of upcoming) {
    const gapHrs = (event.startTime.getTime() - cursor.getTime()) / 3_600_000
    if (gapHrs >= minHours) {
      return { start: cursor, end: event.startTime, label: `${format(cursor, 'h:mm a')} - ${format(event.startTime, 'h:mm a')}` }
    }
    if (isAfter(event.endTime, cursor)) cursor = event.endTime
  }

  const end = addHours(cursor, minHours)
  return { start: cursor, end, label: `${format(cursor, 'h:mm a')} - ${format(end, 'h:mm a')}` }
}