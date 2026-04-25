'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface TopNavProps {
  activeTab: 'suggestions' | 'group'
  onTabChange: (tab: 'suggestions' | 'group') => void
  onReset: () => void
  userName?: string
  userEmail?: string
}

export function TopNav({ activeTab, onTabChange, onReset, userName, userEmail }: TopNavProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === '1'
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'
  
  // Profile URL - preserves demo mode if active
  const profileUrl = isDemo ? '/profile?demo=1' : '/profile'

  return (
    <header className="flex items-start justify-between px-5 pt-4 pb-3">
      <div>
        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
          {activeTab === 'suggestions' ? 'YOUR NUDGES' : 'GROUP VIEW'}
        </p>
        <h1 className="text-[26px] font-medium tracking-tight text-app-text">
          Your <span className="text-brand">Nudges</span>
        </h1>
      </div>
      
      {/* Dark mode toggle */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle dark mode"
        className="relative mt-1 h-[27px] w-[46px] flex-shrink-0"
      >
        <span className={`absolute inset-0 rounded-full transition-colors ${isDark ? 'bg-brand' : 'bg-app-border-strong'}`} />
        <span className={`absolute top-[2px] h-[23px] w-[23px] rounded-full border-[0.5px] border-black/10 bg-white transition-all ${isDark ? 'left-[21px]' : 'left-[2px]'}`} />
      </button>
    </header>
  )
}
