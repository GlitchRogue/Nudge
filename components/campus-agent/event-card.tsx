'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EventSuggestion, sourceBadgeColors } from '@/lib/mockData'

// Visual tag mapping based on event category
const TAG_META: Record<string, { label: string; color: string }> = {
  'Career': { label: 'Networking', color: '#2563EB' },
  'Social': { label: 'Fun', color: '#9333EA' },
  'Food': { label: 'Food', color: '#EA580C' },
  'Academic': { label: 'Academic', color: '#059669' },
  'Workshop': { label: 'Popup', color: '#DC2626' },
  'default': { label: 'Event', color: '#6B7280' },
}

function getVisualTag(category: string) {
  return TAG_META[category] || TAG_META['default']
}

interface EventCardProps {
  suggestion: EventSuggestion
  onAddToCalendar: (eventId: string) => void
  onTellMeMore: (eventId: string) => void
  onApproveRearrangement: (eventId: string) => void
  isAdded?: boolean
}

export function EventCard({
  suggestion,
  onAddToCalendar,
  onTellMeMore,
  onApproveRearrangement,
  isAdded = false,
}: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { event, matchScore, matchReason, reasoning, conflict } = suggestion
  const tag = getVisualTag(event.category)
  const lowSpots = event.spotsLeft !== undefined && event.spotsLeft <= 10
  const faded = matchScore < 30

  return (
    <article className={cn(
      'mb-3 overflow-hidden rounded-2xl border border-app-border bg-app-card transition-opacity',
      faded && 'opacity-50',
      isAdded && 'ring-2 ring-brand/50'
    )}>
      {/* Color bar at top */}
      <div className="h-1" style={{ background: tag.color }} />
      
      <div className="px-4 pb-3 pt-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span 
            className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em]"
            style={{ color: tag.color }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: tag.color }} />
            {tag.label}
          </span>
          <span className="text-[12px] font-medium text-app-muted">
            {format(event.startTime, 'h:mm a')}
          </span>
        </div>
        
        {/* Title and description */}
        <h3 className="mb-1 mt-2 text-[15.5px] font-medium leading-snug text-app-text">
          {event.title}
        </h3>
        <p className="mb-2.5 text-[12.5px] leading-snug text-app-muted">
          {event.description}
        </p>
        
        {/* Meta row */}
        <div className="mb-2.5 flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', sourceBadgeColors[event.source])}>
            {event.source}
          </span>
          <span className="text-[12px] text-app-muted">{event.location}</span>
          {lowSpots && (
            <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">
              {event.spotsLeft} spots left
            </span>
          )}
          <span className={cn(
            'ml-auto text-[11px] font-medium',
            matchScore >= 50 ? 'text-brand' : 'text-app-muted'
          )}>
            {matchScore}%
          </span>
        </div>

        {/* Conflict warning */}
        {conflict && (
          <div className="mb-3 rounded-xl bg-orange-50 p-3 dark:bg-orange-950/30">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400" />
              <div className="flex-1">
                <p className="text-[12px] font-medium text-orange-800 dark:text-orange-200">
                  Conflicts with: {conflict.existingEvent.title}
                </p>
                <p className="mt-1 text-[11px] text-orange-700 dark:text-orange-300">
                  {conflict.proposedRearrangement}
                </p>
                <button
                  type="button"
                  onClick={() => onApproveRearrangement(event.id)}
                  className="mt-2 rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-[11px] font-medium text-orange-800 transition hover:bg-orange-50 dark:border-orange-700 dark:bg-orange-900/50 dark:text-orange-200"
                >
                  <Check className="mr-1 inline h-3 w-3" />
                  Approve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expand reasoning */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex w-full items-center gap-1 text-[11px] text-app-muted hover:text-app-text"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              Hide reasoning
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              Why this matches
            </>
          )}
        </button>

        {isExpanded && (
          <ul className="mb-3 space-y-1 border-t border-app-border pt-2">
            {reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-[12px] text-app-muted">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {/* Action button */}
        <button
          type="button"
          onClick={() => isAdded ? onTellMeMore(event.id) : onAddToCalendar(event.id)}
          disabled={isAdded}
          className={cn(
            'w-full rounded-lg border py-2 text-[12px] font-medium transition',
            isAdded
              ? 'border-brand bg-brand-bg text-brand'
              : 'border-app-border-strong text-app-subtle hover:bg-app-surface'
          )}
        >
          {isAdded ? 'Added to Calendar' : 'Add to Calendar'}
        </button>
      </div>
    </article>
  )
}
