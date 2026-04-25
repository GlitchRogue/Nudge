"use client"

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function AppHeader({ eyebrow }: { eyebrow: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <header className="flex justify-between items-start px-5 pt-4 pb-3">
      <div>
        <p className="text-[11px] text-app-muted tracking-[0.08em] font-medium mb-1">
          {eyebrow}
        </p>
        <h1 className="text-[26px] font-medium tracking-tight">
          Your <span className="text-brand">Nudges</span>
        </h1>
      </div>
      <button
        type="button"
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        aria-label="Toggle dark mode"
        className="relative w-[46px] h-[27px] flex-shrink-0 mt-1"
      >
        <span className={`absolute inset-0 rounded-full transition-colors ${isDark ? 'bg-brand' : 'bg-app-border-strong'}`} />
        <span className={`absolute top-[2px] w-[23px] h-[23px] bg-white rounded-full transition-all border-[0.5px] border-black/10 ${isDark ? 'left-[21px]' : 'left-[2px]'}`} />
      </button>
    </header>
  )
}