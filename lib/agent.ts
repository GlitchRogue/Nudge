import {
  availableEvents,
  calendarEvents,
  userProfile,
  EventSuggestion,
  AvailableEvent,
  CalendarEvent,
} from './mockData'
import { areIntervalsOverlapping } from 'date-fns'

interface ScoredEvent {
  event: AvailableEvent
  interestScore: number
  timeScore: number
  noveltyScore: number
  totalScore: number
  matchReason: string
  reasoning: string[]
  conflict?: {
    existingEvent: CalendarEvent
    proposedRearrangement: string
  }
}

// Score events based on user profile
function scoreEvent(event: AvailableEvent): ScoredEvent {
  const reasoning: string[] = []
  let interestScore = 0
  let timeScore = 0
  let noveltyScore = 0

  // Interest matching
  const matchingInterests = userProfile.interests.filter((interest) => {
    const interestLower = interest.toLowerCase()
    return (
      event.tags.some((tag) => tag.toLowerCase().includes(interestLower)) ||
      event.category.toLowerCase().includes(interestLower) ||
      event.title.toLowerCase().includes(interestLower) ||
      event.description.toLowerCase().includes(interestLower)
    )
  })

  if (matchingInterests.length > 0) {
    interestScore = Math.min(50, matchingInterests.length * 20)
    reasoning.push(`Matches your interests: ${matchingInterests.join(', ')}`)
  }

  // Time preference matching
  const eventHour = event.startTime.getHours()
  const isEvening = eventHour >= 17
  const isAfternoon = eventHour >= 12 && eventHour < 17

  if (userProfile.constraints.preferredTimes.includes('evening') && isEvening) {
    timeScore += 15
    reasoning.push('Fits your preferred evening schedule')
  }
  if (userProfile.constraints.preferredTimes.includes('afternoon') && isAfternoon) {
    timeScore += 15
    reasoning.push('Fits your preferred afternoon schedule')
  }

  // Novelty score (random for demo, would be based on history in real app)
  noveltyScore = Math.floor(Math.random() * 20) + 10
  if (event.spotsLeft !== undefined && event.spotsLeft <= 10) {
    noveltyScore += 10
    reasoning.push(`Limited availability: only ${event.spotsLeft} spots left`)
  }

  // Career relevance for CS major
  if (
    event.category === 'Career' ||
    event.tags.some((t) => ['tech', 'engineering', 'AI', 'ML', 'coding'].includes(t.toLowerCase()))
  ) {
    interestScore += 10
    reasoning.push('Relevant to your CS career path')
  }

  const totalScore = Math.min(100, interestScore + timeScore + noveltyScore)

  // Generate match reason
  let matchReason = ''
  if (matchingInterests.length > 0) {
    matchReason = `Perfect for your ${matchingInterests[0]} interest`
  } else if (timeScore > 0) {
    matchReason = 'Fits well in your schedule'
  } else {
    matchReason = 'Might be worth exploring something new'
  }

  return {
    event,
    interestScore,
    timeScore,
    noveltyScore,
    totalScore,
    matchReason,
    reasoning,
  }
}

// Check for conflicts with existing calendar
function checkConflicts(scoredEvent: ScoredEvent): ScoredEvent {
  const eventStart = scoredEvent.event.startTime
  const eventEnd = scoredEvent.event.endTime

  for (const calEvent of calendarEvents) {
    const hasOverlap = areIntervalsOverlapping(
      { start: eventStart, end: eventEnd },
      { start: calEvent.startTime, end: calEvent.endTime }
    )

    if (hasOverlap) {
      // Only suggest rearrangement for low/medium priority events
      if (calEvent.priority !== 'high') {
        const proposedRearrangement =
          calEvent.priority === 'low'
            ? `Move "${calEvent.title}" to an earlier slot to attend this event`
            : `Consider rescheduling "${calEvent.title}" - this event seems higher value`

        return {
          ...scoredEvent,
          conflict: {
            existingEvent: calEvent,
            proposedRearrangement,
          },
        }
      } else {
        // High priority conflict - reduce score
        return {
          ...scoredEvent,
          totalScore: Math.max(0, scoredEvent.totalScore - 30),
          reasoning: [...scoredEvent.reasoning, `Conflicts with "${calEvent.title}" (cannot be moved)`],
        }
      }
    }
  }

  return scoredEvent
}

// Generate top suggestions
export function generateSuggestions(): EventSuggestion[] {
  // Score all events
  const scoredEvents = availableEvents.map((event) => {
    const scored = scoreEvent(event)
    return checkConflicts(scored)
  })

  // Sort by score and return top suggestions
  scoredEvents.sort((a, b) => b.totalScore - a.totalScore)

  return scoredEvents.slice(0, 6).map((scored) => ({
    event: scored.event,
    matchScore: scored.totalScore,
    matchReason: scored.matchReason,
    reasoning: scored.reasoning,
    conflict: scored.conflict,
  }))
}

// Search events with filters
export function searchEvents(
  query: string,
  filters?: { category?: string; source?: string }
): AvailableEvent[] {
  return availableEvents.filter((event) => {
    const matchesQuery =
      query === '' ||
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.description.toLowerCase().includes(query.toLowerCase()) ||
      event.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))

    const matchesCategory =
      !filters?.category || event.category.toLowerCase() === filters.category.toLowerCase()
    const matchesSource = !filters?.source || event.source.toLowerCase() === filters.source.toLowerCase()

    return matchesQuery && matchesCategory && matchesSource
  })
}
