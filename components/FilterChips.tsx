"use client"

import { TAG_META, type VisualTag } from '@/lib/tag-mapping'

export type FilterValue = 'all' | VisualTag

const FILTERS: { value: FilterValue; label: string; color?: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'food',       label: 'Food',       color: TAG_META.food.color },
  { value: 'popup',      label: 'Popup',      color: TAG_META.popup.color },
  { value: 'networking', label: 'Networking', color: TAG_META.networking.color },
  { value: 'fun',        label: 'Fun',        color: TAG_META.fun.color },
]

export function FilterChips({ value, onChange }: { value: FilterValue; onChange: (v: FilterValue) => void }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-4">
      {FILTERS.map(f => {
        const active = value === f.value
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border whitespace-nowrap font-medium flex-shrink-0 transition ${active ? 'bg-app-text text-app-bg border-app-text' : 'bg-app-card text-app-text border-app-border-strong'}`}
          >
            {f.color && <span className="w-[7px] h-[7px] rounded-full" style={{ background: f.color }} />}
            {f.label}
          </button>
        )
      })}
    </div>
  )
}