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
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
        <h2 className="text-base font-semibold text-foreground sm:text-lg">Today&apos;s Suggestions</h2>
      </div>

      {isLoading ? (
        <div className="space-y-2 sm:space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-20 sm:h-5 sm:w-24" />
                  <Skeleton className="h-4 w-36 sm:h-5 sm:w-48" />
                  <Skeleton className="h-3 w-24 sm:h-4 sm:w-32" />
                  <Skeleton className="h-3 w-full sm:h-4" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg sm:h-12 sm:w-12" />
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 sm:w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
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
