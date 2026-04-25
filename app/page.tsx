"use client"

import { useState } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav, type Tab } from '@/components/BottomNav'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { WeekScreen } from '@/components/screens/WeekScreen'
import { AskScreen } from '@/components/screens/AskScreen'
import { SettingsScreen } from '@/components/screens/SettingsScreen'

const EYEBROWS: Record<Tab, string> = {
  home:     'THURSDAY · FREE 12—2PM',
  week:     'WEEKLY LINEUP',
  ask:      'ASK NUDGE',
  settings: 'PROFILE & PREFERENCES',
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('home')

  return (
    <div className="min-h-screen bg-app-surface flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-app-bg relative">
        <AppHeader eyebrow={EYEBROWS[tab]} />
        <main className="flex-1 px-5 pb-24">
          {tab === 'home'     && <HomeScreen />}
          {tab === 'week'     && <WeekScreen />}
          {tab === 'ask'      && <AskScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}