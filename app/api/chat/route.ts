import {
  convertToModelMessages,
  InferUITools,
  stepCountIs,
  streamText,
  tool,
  UIDataTypes,
  UIMessage,
  validateUIMessages,
} from 'ai'
import { z } from 'zod'
import { availableEvents, calendarEvents, userProfile } from '@/lib/mock'
import { format } from 'date-fns'

export const maxDuration = 30

// Tool definitions
const searchEventsTool = tool({
  description: 'Search for available events based on query and filters',
  inputSchema: z.object({
    query: z.string().describe('Search query for events'),
    category: z.string().nullable().describe('Filter by category like Academic, Social, Sports'),
    source: z.string().nullable().describe('Filter by source like Eventbrite, Campus Portal'),
  }),
  async *execute({ query, category, source }) {
    yield { state: 'searching' as const, query }

    await new Promise((resolve) => setTimeout(resolve, 800))

    const results = availableEvents.filter((event) => {
      const matchesQuery =
        query === '' ||
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description.toLowerCase().includes(query.toLowerCase()) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))

      const matchesCategory = !category || event.category.toLowerCase() === category.toLowerCase()
      const matchesSource = !source || event.source.toLowerCase() === source.toLowerCase()

      return matchesQuery && matchesCategory && matchesSource
    })

    yield {
      state: 'ready' as const,
      results: results.slice(0, 5).map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        date: format(e.startTime, 'EEE, MMM d h:mm a'),
        location: e.location,
      })),
      totalFound: results.length,
    }
  },
})

const checkCalendarTool = tool({
  description: 'Check the user calendar for a specific date range',
  inputSchema: z.object({
    startDate: z.string().describe('Start date in ISO format'),
    endDate: z.string().describe('End date in ISO format'),
  }),
  async *execute({ startDate, endDate }) {
    yield { state: 'checking' as const }

    await new Promise((resolve) => setTimeout(resolve, 600))

    const start = new Date(startDate)
    const end = new Date(endDate)

    const events = calendarEvents.filter((event) => {
      return event.startTime >= start && event.startTime <= end
    })

    yield {
      state: 'ready' as const,
      events: events.map((e) => ({
        title: e.title,
        time: format(e.startTime, 'EEE h:mm a'),
        type: e.type,
        priority: e.priority,
      })),
      freeSlots: ['Tuesday 3-5pm', 'Wednesday 12-2pm', 'Friday 4-6pm'],
    }
  },
})

const proposeRearrangementTool = tool({
  description: 'Propose rearranging an existing event to make room for a new one',
  inputSchema: z.object({
    existingEventId: z.string().describe('ID of the existing event to move'),
    newEventId: z.string().describe('ID of the new event to add'),
    proposedTime: z.string().describe('Proposed new time for the existing event'),
  }),
  async *execute({ existingEventId, newEventId, proposedTime }) {
    yield { state: 'analyzing' as const }

    await new Promise((resolve) => setTimeout(resolve, 500))

    const existingEvent = calendarEvents.find((e) => e.id === existingEventId)
    const newEvent = availableEvents.find((e) => e.id === newEventId)

    yield {
      state: 'ready' as const,
      proposal: {
        existingEvent: existingEvent?.title || 'Unknown event',
        newEvent: newEvent?.title || 'Unknown event',
        proposedTime,
        conflict: existingEvent?.priority === 'high' ? 'High priority event - not recommended' : null,
      },
    }
  },
})

const addToCalendarTool = tool({
  description: 'Add an event to the user calendar',
  inputSchema: z.object({
    eventId: z.string().describe('ID of the event to add'),
  }),
  async *execute({ eventId }) {
    yield { state: 'adding' as const }

    await new Promise((resolve) => setTimeout(resolve, 400))

    const event = availableEvents.find((e) => e.id === eventId)

    yield {
      state: 'ready' as const,
      success: true,
      event: event
        ? {
            title: event.title,
            time: format(event.startTime, 'EEE, MMM d h:mm a'),
            location: event.location,
          }
        : null,
    }
  },
})

const tools = {
  searchEvents: searchEventsTool,
  checkCalendar: checkCalendarTool,
  proposeRearrangement: proposeRearrangementTool,
  addToCalendar: addToCalendarTool,
} as const

export type CampusAgentMessage = UIMessage<never, UIDataTypes, InferUITools<typeof tools>>

export async function POST(req: Request) {
  const body = await req.json()

  const messages = await validateUIMessages<CampusAgentMessage>({
    messages: body.messages,
    tools,
  })

  const systemPrompt = `You are Campus Agent, an AI scheduling assistant for college students. You help students discover events and manage their calendars.

User Profile:
- Name: ${userProfile.name}
- Major: ${userProfile.major}, ${userProfile.year}
- Interests: ${userProfile.interests.join(', ')}
- Preferred times: ${userProfile.constraints.preferredTimes.join(', ')}
- Max events per day: ${userProfile.constraints.maxEventsPerDay}

Your personality:
- Concise and direct - no filler words or excessive enthusiasm
- Slightly dry humor is okay
- Never sycophantic - don't over-praise or use phrases like "Great question!"
- Focus on being genuinely helpful

When answering:
- Use tools to search events and check the calendar when relevant
- Provide specific recommendations based on the user's interests
- If there are conflicts, proactively suggest rearrangements
- Keep responses short - 1-3 sentences unless more detail is needed`

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools,
  })

  return result.toUIMessageStreamResponse()
}
