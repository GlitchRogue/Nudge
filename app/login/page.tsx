'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Sparkles, Check } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'signin' | 'connecting' | 'connected'>('signin')

  const handleSignIn = () => {
    setStep('connecting')
    // Simulate the Google OAuth + calendar connection flow
    setTimeout(() => {
      setStep('connected')
      setTimeout(() => {
        try {
          localStorage.setItem('nudge-user', JSON.stringify({
            email: 'you@nyu.edu',
            name: 'Student',
            connectedAt: new Date().toISOString(),
          }))
        } catch (e) {
          // localStorage might be unavailable; continue anyway
        }
        router.push('/')
      }, 900)
    }, 1400)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-10 shadow-lg">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Nudge</h1>
          <p className="text-sm text-muted-foreground">
            Your AI scheduling agent. Find events that fit your life.
          </p>
        </div>

        {/* State: Sign-in */}
        {step === 'signin' && (
          <div className="space-y-4">
            <button
              onClick={handleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 font-medium text-gray-800 transition hover:bg-gray-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
            <button
              onClick={handleSignIn}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700"
            >
              Continue as Demo User
            </button>
            <p className="text-center text-xs text-muted-foreground">
              We'll connect your calendar to find events that fit your free time.
            </p>
          </div>
        )}

        {/* State: Connecting */}
        {step === 'connecting' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            <div>
              <p className="font-medium">Connecting to Google Calendar</p>
              <p className="text-sm text-muted-foreground">Reading your schedule for the week...</p>
            </div>
            <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-left text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                Authenticating with Google
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                Fetching upcoming events
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                Analyzing free time blocks
              </div>
            </div>
          </div>
        )}

        {/* State: Connected */}
        {step === 'connected' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Calendar connected</p>
              <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              12 events found this week
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
