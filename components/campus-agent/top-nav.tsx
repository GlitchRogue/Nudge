'use client'

import { useSearchParams } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Smartphone, Monitor, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'

export type LayoutMode = 'auto' | 'mobile' | 'desktop'

interface TopNavProps {
  activeTab: 'suggestions' | 'group'
  onTabChange: (tab: 'suggestions' | 'group') => void
  onReset: () => void
  userName?: string
  userEmail?: string
  layoutMode?: LayoutMode
  onLayoutModeChange?: (mode: LayoutMode) => void
}

export function TopNav({ activeTab, onTabChange, onReset, userName, userEmail, layoutMode = 'auto', onLayoutModeChange }: TopNavProps) {
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
        <p className="mb-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
          {activeTab === 'suggestions' ? 'YOUR NUDGES' : 'GROUP VIEW'}
        </p>
        <h1 className="text-[22px] font-medium tracking-tight text-app-text">
          Your <span className="text-brand">Nudges</span>
        </h1>
      </div>
      
      <div className="mt-1 flex items-center gap-2">
        {/* Layout mode toggle: auto / mobile / desktop */}
        {onLayoutModeChange && (
          <div className="inline-flex h-[27px] items-center rounded-full border border-app-border-strong bg-app-card p-0.5">
            <button
              type="button"
              onClick={() => onLayoutModeChange('auto')}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition ${
                layoutMode === 'auto' ? 'bg-brand text-white' : 'text-app-muted hover:text-app-text'
              }`}
              aria-label="Auto layout"
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange('mobile')}
              className={`flex h-[21px] w-[24px] items-center justify-center rounded-full transition ${
                layoutMode === 'mobile' ? 'bg-brand text-white' : 'text-app-muted hover:text-app-text'
              }`}
              aria-label="Force mobile layout"
            >
              <Smartphone className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onLayoutModeChange('desktop')}
              className={`flex h-[21px] w-[24px] items-center justify-center rounded-full transition ${
                layoutMode === 'desktop' ? 'bg-brand text-white' : 'text-app-muted hover:text-app-text'
              }`}
              aria-label="Force desktop layout"
            >
              <Monitor className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle dark mode"
          className="relative h-[27px] w-[46px] flex-shrink-0"
        >
          <span className={`absolute inset-0 rounded-full transition-colors ${isDark ? 'bg-brand' : 'bg-app-border-strong'}`} />
          <span className={`absolute top-[2px] h-[23px] w-[23px] rounded-full border-[0.5px] border-black/10 bg-white transition-all ${isDark ? 'left-[21px]' : 'left-[2px]'}`} />
        </button>

        {/* Sign out (only when actually signed in, not in demo) */}
        {!isDemo && userEmail && (
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            aria-label="Sign out"
            title={`Sign out ${userEmail}`}
            className="flex h-[27px] w-[27px] items-center justify-center rounded-full border border-app-border-strong bg-app-card text-app-muted hover:text-app-text"
          >
            <LogOut className="h-3 w-3" />
          </button>
        )}
      </div>
    </header>
  )
}
