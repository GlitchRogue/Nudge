"use client"

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav, type Tab } from '@/components/BottomNav'
import { HomeScreen } from '@/components/screens/HomeScreen'
import { WeekScreen } from '@/components/screens/WeekScreen'
import { AskScreen } from '@/components/screens/AskScreen'
import { SettingsScreen } from '@/components/screens/SettingsScreen'
import { getNextFreeSlot, type FreeSlot } from '@/lib/free-slots'

const STATIC_EYEBROWS: Record<Exclude<Tab, 'home'>, string> = {
  week:     'WEEKLY LINEUP',
  ask:      'ASK NUDGE',
  settings: 'PROFILE & PREFERENCES',
}

function formatSlotForEyebrow(slot: FreeSlot): string {
  const day = format(slot.start, 'EEEE').toUpperCase()
  const start = format(slot.start, 'h')
  const end = format(slot.end, 'h')
  const startSuffix = format(slot.start, 'a').toUpperCase()
  const endSuffix = format(slot.end, 'a').toUpperCase()
  return startSuffix === endSuffix
    ? `${day} · FREE ${start}—${end}${endSuffix}`
    : `${day} · FREE ${start}${startSuffix}—${end}${endSuffix}`
}

export default function Page() {
  const [tab, setTab] = useState<Tab>('home')
  const [slot, setSlot] = useState<FreeSlot | null>(null)

  useEffect(() => {
    setSlot(getNextFreeSlot())
  }, [])

  const eyebrow =
    tab === 'home'
      ? slot ? formatSlotForEyebrow(slot) : 'TODAY'
      : STATIC_EYEBROWS[tab]

  return (
    <div className="min-h-screen bg-app-surface flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-app-bg relative">
        <AppHeader eyebrow={eyebrow} />
        <main className="flex-1 px-5 pb-24">
          {tab === 'home'     && <HomeScreen free-slots={slot} />}
          {tab === 'week'     && <WeekScreen />}
          {tab === 'ask'      && <AskScreen />}
          {tab === 'settings' && <SettingsScreen />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
    </div>
  )
}