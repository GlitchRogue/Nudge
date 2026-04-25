'use client'

import { EventCard } from './event-card'
import { EventSuggestion } from '@/lib/mockData'

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
  // Split suggestions into top matches (in free window) and later
  const topMatches = suggestions.filter(s => s.matchScore >= 50).slice(0, 3)
  const laterEvents = suggestions.filter(s => s.matchScore < 50).slice(0, 3)

  return (
    <div className="flex flex-col">
      {/* Free window card placeholder */}
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-app-border bg-app-card p-3.5">
        <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-xl bg-brand-bg text-brand">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.06em] text-app-muted">
            NEXT FREE WINDOW
          </p>
          <p className="text-[16px] font-medium text-app-text">12:00 PM - 2:00 PM</p>
        </div>
        <span className="flex-shrink-0 rounded-full bg-app-surface px-2.5 py-1 text-[12px] font-medium text-app-muted">
          2 hrs
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[180px] animate-pulse rounded-2xl border border-app-border bg-app-card" />
          ))}
        </div>
      ) : (
        <>
          {/* Top matches section */}
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
            SUGGESTED FOR YOUR FREE WINDOW
          </p>
          
          {topMatches.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-app-muted">No events match this filter</p>
          ) : (
            topMatches.map((suggestion) => (
              <EventCard
                key={suggestion.event.id}
                suggestion={suggestion}
                isAdded={addedEventIds.has(suggestion.event.id)}
                onAddToCalendar={onAddToCalendar}
                onTellMeMore={onTellMeMore}
                onApproveRearrangement={onApproveRearrangement}
              />
            ))
          )}

          {/* Later events section */}
          {laterEvents.length > 0 && (
            <>
              <p className="mb-3 mt-5 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
                LATER TODAY
              </p>
              {laterEvents.map((suggestion) => (
                <EventCard
                  key={suggestion.event.id}
                  suggestion={suggestion}
                  isAdded={addedEventIds.has(suggestion.event.id)}
                  onAddToCalendar={onAddToCalendar}
                  onTellMeMore={onTellMeMore}
                  onApproveRearrangement={onApproveRearrangement}
                />
              ))}
            </>
          )}
        </>
      )}
    </div>
  )
}
