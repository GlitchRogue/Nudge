"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { userProfile as DEFAULT_USER, type UserProfile } from './mock'

type ConnectionKey = 'Eventbrite' | 'Campus Portal' | 'Career Center' | 'Newsletter'

interface DemoProfile {
  user: UserProfile
  school: string
  connections: Record<ConnectionKey, boolean>
}

interface ProfileContextValue extends DemoProfile {
  interests: string[]
  toggleInterest: (i: string) => void
  setSchool: (s: string) => void
  toggleConnection: (k: ConnectionKey) => void
}

const STORAGE_KEY = 'nudge_profile_v2'
const ProfileContext = createContext<ProfileContextValue | null>(null)

const DEFAULTS: DemoProfile = {
  user: DEFAULT_USER,
  school: 'Stanford University',
  connections: { Eventbrite: true, 'Campus Portal': true, 'Career Center': false, Newsletter: true },
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DemoProfile>(DEFAULTS)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setProfile(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)) } catch {}
  }, [profile])

  const toggleInterest = (i: string) =>
    setProfile(p => {
      const has = p.user.interests.includes(i)
      const interests = has ? p.user.interests.filter(x => x !== i) : [...p.user.interests, i]
      return { ...p, user: { ...p.user, interests } }
    })

  const setSchool = (school: string) => setProfile(p => ({ ...p, school }))

  const toggleConnection = (k: ConnectionKey) =>
    setProfile(p => ({ ...p, connections: { ...p.connections, [k]: !p.connections[k] } }))

  return (
    <ProfileContext.Provider value={{
      ...profile,
      interests: profile.user.interests,
      toggleInterest, setSchool, toggleConnection,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}