'use client'

import { useState } from 'react'
import { MapPin, Clock, ChevronDown, ChevronUp, AlertTriangle, Check, Plus, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { EventSuggestion, sourceBadgeColors } from '@/lib/mockData'
import { ClientTime } from '@/components/ui/client-time'

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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10'
    if (score >= 60) return 'text-primary bg-primary/10'
    return 'text-muted-foreground bg-muted'
  }

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-md',
      isAdded && 'ring-2 ring-success/50'
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className={cn('text-xs', sourceBadgeColors[event.source])}>
                {event.source}
              </Badge>
              {event.spotsLeft !== undefined && event.spotsLeft <= 10 && (
                <Badge variant="outline" className="text-xs text-destructive">
                  {event.spotsLeft} spots left
                </Badge>
              )}
            </div>

            <h3 className="mb-1 text-base font-semibold text-foreground">{event.title}</h3>

            <div className="mb-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                <ClientTime date={event.startTime} />
              </span>
            </div>

            <p className="text-sm text-muted-foreground">{matchReason}</p>
          </div>

          <div className={cn(
            'flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg',
            getScoreColor(matchScore)
          )}>
            <span className="text-lg font-bold">{matchScore}</span>
            <span className="text-[10px] uppercase tracking-wide opacity-70">match</span>
          </div>
        </div>

        {conflict && (
          <div className="mt-3 rounded-lg bg-warning/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-warning-foreground">
                  Conflicts with: {conflict.existingEvent.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {conflict.proposedRearrangement}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => onApproveRearrangement(event.id)}
                >
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Approve
                </Button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex w-full items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide reasoning
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show reasoning
            </>
          )}
        </button>

        {isExpanded && (
          <ul className="mt-2 space-y-1 border-t border-border pt-3">
            {reasoning.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row">
          <Button
            variant={isAdded ? 'secondary' : 'default'}
            size="sm"
            className="flex-1 text-xs sm:text-sm"
            onClick={() => onAddToCalendar(event.id)}
            disabled={isAdded}
          >
            {isAdded ? (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Added
              </>
            ) : (
              <>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add to calendar
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm" onClick={() => onTellMeMore(event.id)}>
            <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
            Tell me more
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
