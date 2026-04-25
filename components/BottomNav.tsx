"use client"

import { Home, Calendar, MessageSquare, Settings } from 'lucide-react'

export type Tab = 'home' | 'week' | 'ask' | 'settings'

const TABS: { value: Tab; label: string; Icon: typeof Home }[] = [
  { value: 'home',     label: 'Home',      Icon: Home },
  { value: 'week',     label: 'Week',      Icon: Calendar },
  { value: 'ask',      label: 'Ask Nudge', Icon: MessageSquare },
  { value: 'settings', label: 'Settings',  Icon: Settings },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 mx-auto max-w-md grid grid-cols-4 border-t border-app-border bg-app-bg pt-2 pb-3.5 z-10">
      {TABS.map(({ value, label, Icon }) => {
        const on = active === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium py-2 transition ${on ? 'text-brand' : 'text-app-subtle'}`}
          >
            <Icon size={20} />
            {label}
          </button>
        )
      })}
    </nav>
  )
}