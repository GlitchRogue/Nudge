'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, MessageSquare, Sparkles } from 'lucide-react'
import { TopNav } from '@/components/campus-agent/top-nav'
import { SuggestionsPanel } from '@/components/campus-agent/suggestions-panel'
import { ChatInterface } from '@/components/campus-agent/chat-interface'
import { WeekCalendar } from '@/components/campus-agent/week-calendar'
import { MobileCalendar } from '@/components/campus-agent/mobile-calendar'
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
        // Try /events first — if we already have a session it just works.
        // If we get a 401, mint a demo session and retry once.
        let ranked
        try {
          ranked = await apiEvents.list()
          console.log('[Nudge] backend /events OK, count:', ranked.length)
        } catch (err) {
          console.log('[Nudge] /events failed, trying demo session:', err)
          await apiAuth.demo()
          ranked = await apiEvents.list()
          console.log('[Nudge] backend /events after demo, count:', ranked.length)
        }
        if (cancelled) return
        const mapped = ranked.map(rankedToSuggestion)
        console.log('[Nudge] mapped suggestions:', mapped.length)
        if (mapped.length > 0) {
          setSuggestions(mapped)
        }
      } catch (err) {
        console.error('[Nudge] Backend fetch failed, keeping fallback:', err)
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
      setAddedEventIds((prev) => {
        const next = new Set(prev)
        const wasAdded = next.has(eventId)
        if (wasAdded) {
          next.delete(eventId)
        } else {
          next.add(eventId)
        }
        if (backendEnabled) {
          apiActions
            .record(eventId, wasAdded ? 'dismiss' : 'add_to_calendar')
            .catch((err) =>
              console.warn('[Nudge] action failed:', err),
            )
        }
        return next
      })
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
    <div className="flex min-h-screen flex-col bg-app-surface">
      {/* Centered container like frontend design */}
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-app-bg lg:max-w-none">
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
                  <div className="h-full overflow-hidden p-3">
                    <MobileCalendar
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
              <nav className="flex-shrink-0 border-t border-app-border bg-app-bg pt-2 pb-3.5">
                <div className="grid grid-cols-3">
                  <button
                    onClick={() => setMobileTab('calendar')}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors',
                      mobileTab === 'calendar'
                        ? 'text-brand'
                        : 'text-app-subtle'
                    )}
                  >
                    <Calendar className="h-5 w-5" />
                    Week
                  </button>
                  <button
                    onClick={() => setMobileTab('chat')}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors',
                      mobileTab === 'chat'
                        ? 'text-brand'
                        : 'text-app-subtle'
                    )}
                  >
                    <MessageSquare className="h-5 w-5" />
                    Ask Nudge
                  </button>
                  <button
                    onClick={() => setMobileTab('events')}
                    className={cn(
                      'flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors',
                      mobileTab === 'events'
                        ? 'text-brand'
                        : 'text-app-subtle'
                    )}
                  >
                    <Sparkles className="h-5 w-5" />
                    Events
                  </button>
                </div>
              </nav>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto">
            <GroupTab onBack={() => setActiveTab('suggestions')} />
          </div>
        )}
      </div>
    </div>
  )
}
