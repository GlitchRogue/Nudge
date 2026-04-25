"use client"

import { ThemeProvider } from 'next-themes'
import { ProfileProvider } from '@/lib/profile-store'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ProfileProvider>{children}</ProfileProvider>
    </ThemeProvider>
  )
}