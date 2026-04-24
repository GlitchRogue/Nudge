'use client'

import { Sparkles } from 'lucide-react'
import { EventCard } from './event-card'
import { EventSuggestion } from '@/lib/mockData'
import { Skeleton } from '@/components/ui/skeleton'

interface SuggestionsPanelProps {
  suggestions: EventSuggestion[]
  isLoading: boolean
  addedEventIds: Set<string>
  onAddToCalendar: (eventId: string) => void
  onTellMeMore: (eventId: string) => void
  onApproveRearrangement: (eventId: string) => void
}

export function SuggestionsPanel({
  suggestions,
  isLoading,
  addedEventIds,
  onAddToCalendar,
  onTellMeMore,
  onApproveRearrangement,
}: SuggestionsPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Today&apos;s Suggestions</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.slice(0, 3).map((suggestion) => (
            <EventCard
              key={suggestion.event.id}
              suggestion={suggestion}
              isAdded={addedEventIds.has(suggestion.event.id)}
              onAddToCalendar={onAddToCalendar}
              onTellMeMore={onTellMeMore}
              onApproveRearrangement={onApproveRearrangement}
            />
          ))}
        </div>
      )}
    </div>
  )
}
