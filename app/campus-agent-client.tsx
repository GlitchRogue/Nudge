'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, MessageSquare, Sparkles } from 'lucide-react'
import { TopNav } from '@/components/campus-agent/top-nav'
import { SuggestionsPanel } from '@/components/campus-agent/suggestions-panel'
import { ChatInterface } from '@/components/campus-agent/chat-interface'
import { WeekCalendar } from '@/components/campus-agent/week-calendar'
import { GroupTab } from '@/components/campus-agent/group-tab'
import { generateSuggestions } from '@/lib/agent'
import { cn } from '@/lib/utils'
import type { CalendarEvent, EventSuggestion } from '@/lib/mockData'
import { apiEvents, apiActions, apiAuth } from '@/lib/api-client'
import { rankedToSuggestion } from '@/lib/event-search'

type MobileTab = 'calendar' | 'chat' | 'events'

interface CampusAgentClientProps {
  calendarEvents: CalendarEvent[]
  initialSuggestions?: EventSuggestion[]
  userName?: string
  userEmail?: string
  profileInterests?: string[]
  /** When true, the client will hit the FastAPI backend for ranked events */
  backendEnabled?: boolean
}

export default function CampusAgentClient({
  calendarEvents,
  initialSuggestions,
  userName,
  userEmail,
  profileInterests,
  backendEnabled,
}: CampusAgentClientProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'group'>('suggestions')
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat') // Default to chat
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>(
    initialSuggestions ?? [],
  )
  const [isLoading, setIsLoading] = useState(
    !initialSuggestions || initialSuggestions.length === 0,
  )
  const [addedEventIds, setAddedEventIds] = useState<Set<string>>(new Set())

  // On mount, hit the backend for real ranked events. The backend session
  // cookie is acquired by signing in (real Google or /auth/demo) — if there's
  // no session yet, we silently auto-call /auth/demo so the demo always works.
  useEffect(() => {
    let cancelled = false
    if (!backendEnabled) {
      // No backend integration; just clear loading.
      setIsLoading(false)
      return
    }

    async function loadFromBackend() {
      try {
        // Make sure we have a backend session. If /user/me 401s, fall back to demo.
        try {
          await apiAuth.me()
        } catch {
          await apiAuth.demo()
        }
        const ranked = await apiEvents.list()
        if (cancelled) return
        const mapped = ranked.map(rankedToSuggestion)
        if (mapped.length > 0) {
          setSuggestions(mapped)
        }
      } catch (err) {
        console.warn('[Nudge] Backend fetch failed, keeping fallback:', err)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadFromBackend()
    return () => {
      cancelled = true
    }
  }, [backendEnabled])

  const handleReset = useCallback(async () => {
    setIsLoading(true)
    setAddedEventIds(new Set())
    setSuggestions([])
    setActiveTab('suggestions')

    if (backendEnabled) {
      try {
        const ranked = await apiEvents.list()
        setSuggestions(ranked.map(rankedToSuggestion))
      } catch {
        setSuggestions(initialSuggestions ?? generateSuggestions())
      } finally {
        setIsLoading(false)
      }
      return
    }

    setTimeout(() => {
      setSuggestions(initialSuggestions ?? generateSuggestions())
      setIsLoading(false)
    }, 600)
  }, [initialSuggestions, backendEnabled])

  const handleAddToCalendar = useCallback(
    (eventId: string) => {
      setAddedEventIds((prev) => new Set([...prev, eventId]))
      if (backendEnabled) {
        apiActions
          .record(eventId, 'add_to_calendar')
          .catch((err) =>
            console.warn('[Nudge] add_to_calendar failed:', err),
          )
      }
    },
    [backendEnabled],
  )

  const handleTellMeMore = useCallback((eventId: string) => {
    console.log('[Nudge] Tell me more about event:', eventId)
  }, [])

  const handleApproveRearrangement = useCallback(
    (eventId: string) => {
      handleAddToCalendar(eventId)
      if (backendEnabled) {
        apiActions
          .record(eventId, 'approved')
          .catch((err) => console.warn('[Nudge] approve failed:', err))
      }
    },
    [handleAddToCalendar, backendEnabled],
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
        userName={userName}
        userEmail={userEmail}
      />

      {activeTab === 'suggestions' ? (
        <>
          {/* Desktop Layout */}
          <div className="hidden flex-1 overflow-hidden lg:flex">
            {/* Left Panel - 60% */}
            <div className="flex w-[60%] flex-col overflow-hidden border-r border-border">
              {/* Suggestions - scrollable section */}
              <div
                className="flex-shrink-0 overflow-auto border-b border-border p-4"
                style={{ maxHeight: '45%' }}
              >
                <SuggestionsPanel
                  suggestions={suggestions}
                  isLoading={isLoading}
                  addedEventIds={addedEventIds}
                  onAddToCalendar={handleAddToCalendar}
                  onTellMeMore={handleTellMeMore}
                  onApproveRearrangement={handleApproveRearrangement}
                />
              </div>

              {/* Chat - takes remaining space */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
                <ChatInterface />
              </div>
            </div>

            {/* Right Panel - Calendar 40% */}
            <div className="w-[40%] overflow-hidden p-4">
              <WeekCalendar
                events={calendarEvents}
                suggestions={suggestions}
                addedEventIds={addedEventIds}
              />
            </div>
          </div>

          {/* Mobile Layout with Tab Navigation */}
          <div className="flex flex-1 flex-col overflow-hidden lg:hidden">
            {/* Mobile Tab Content */}
            <div className="min-h-0 flex-1 overflow-hidden">
              {mobileTab === 'calendar' && (
                <div className="h-full overflow-auto p-3">
                  <WeekCalendar
                    events={calendarEvents}
                    suggestions={suggestions}
                    addedEventIds={addedEventIds}
                  />
                </div>
              )}
              {mobileTab === 'chat' && (
                <div className="flex h-full flex-col overflow-hidden p-3">
                  <ChatInterface />
                </div>
              )}
              {mobileTab === 'events' && (
                <div className="h-full overflow-auto p-3">
                  <SuggestionsPanel
                    suggestions={suggestions}
                    isLoading={isLoading}
                    addedEventIds={addedEventIds}
                    onAddToCalendar={handleAddToCalendar}
                    onTellMeMore={handleTellMeMore}
                    onApproveRearrangement={handleApproveRearrangement}
                  />
                </div>
              )}
            </div>

            {/* Mobile Bottom Tab Bar */}
            <div className="flex-shrink-0 border-t border-border bg-card">
              <div className="flex">
                <button
                  onClick={() => setMobileTab('calendar')}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    mobileTab === 'calendar'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Calendar className={cn('h-5 w-5', mobileTab === 'calendar' && 'text-primary')} />
                  Calendar
                </button>
                <button
                  onClick={() => setMobileTab('chat')}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    mobileTab === 'chat'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <MessageSquare className={cn('h-5 w-5', mobileTab === 'chat' && 'text-primary')} />
                  Chat
                </button>
                <button
                  onClick={() => setMobileTab('events')}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                    mobileTab === 'events'
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Sparkles className={cn('h-5 w-5', mobileTab === 'events' && 'text-primary')} />
                  Events
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-auto">
          <GroupTab onBack={() => setActiveTab('suggestions')} />
        </div>
      )}
    </div>
  )
}
