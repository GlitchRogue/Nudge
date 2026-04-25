"use client"

import { Calendar } from 'lucide-react'
import type { FreeSlot } from '@/lib/free-slots'

export function FreeWindowCard({ slot }: { slot: FreeSlot | null }) {
  if (!slot) {
    return (
      <div
        className="flex items-center gap-3 bg-app-card border border-app-border rounded-2xl p-3.5 mb-4 h-[66px]"
        aria-label="Loading free window"
      />
    )
  }

  const hours = Math.round((slot.end.getTime() - slot.start.getTime()) / 3_600_000)

  return (
    <div className="flex items-center gap-3 bg-app-card border border-app-border rounded-2xl p-3.5 mb-4">
      <div className="w-[38px] h-[38px] rounded-xl bg-brand-bg text-brand grid place-items-center flex-shrink-0">
        <Calendar size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-app-muted tracking-[0.06em] font-medium mb-0.5">NEXT FREE WINDOW</p>
        <p className="text-[16px] font-medium">{slot.label}</p>
      </div>
      <span className="text-[12px] text-app-muted bg-app-surface px-2.5 py-1 rounded-full font-medium flex-shrink-0">
        {hours} hrs
      </span>
    </div>
  )
}