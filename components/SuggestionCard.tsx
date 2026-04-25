"use client"

import { format } from 'date-fns'
import { TAG_META, getVisualTag } from '@/lib/tag-mapping'
import { sourceBadgeColors, type AvailableEvent } from '@/lib/mock'
import { useProfile } from '@/lib/profile-store'
import { scoreEvent } from '@/lib/scoring'

export function SuggestionCard({ event }: { event: AvailableEvent }) {
  const { interests } = useProfile()
  const tag = TAG_META[getVisualTag(event)]
  const score = scoreEvent(event, interests)
  const faded = score !== null && score < 30
  const lowSpots = event.spotsLeft !== undefined && event.spotsLeft <= 10

  return (
    <article className={`bg-app-card border border-app-border rounded-2xl mb-3 overflow-hidden transition-opacity ${faded ? 'opacity-50' : ''}`}>
      <div className="h-1" style={{ background: tag.color }} />
      <div className="px-4 pt-3 pb-3">
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em]" style={{ color: tag.color }}>
            <span className="w-[7px] h-[7px] rounded-full" style={{ background: tag.color }} />
            {tag.label}
          </span>
          <span className="text-[12px] text-app-muted font-medium">{format(event.startTime, 'h:mm a')}</span>
        </div>
        <h3 className="text-[15.5px] font-medium leading-snug mt-2 mb-1">{event.title}</h3>
        <p className="text-[12.5px] text-app-muted leading-snug mb-2.5">{event.description}</p>
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${sourceBadgeColors[event.source]}`}>
            {event.source}
          </span>
          <span className="text-[12px] text-app-muted">{event.location}</span>
          {lowSpots && <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">{event.spotsLeft} spots left</span>}
          {score !== null && (
            <span className={`ml-auto text-[11px] font-medium ${score >= 50 ? 'text-brand' : 'text-app-muted'}`}>{score}%</span>
          )}
        </div>
        <button type="button" className="w-full py-2 text-[12px] rounded-lg border border-app-border-strong text-app-subtle font-medium hover:bg-app-surface transition">
          Add to Calendar
        </button>
      </div>
    </article>
  )
}