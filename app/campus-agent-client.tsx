'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopNav } from '@/components/campus-agent/top-nav'
import { SuggestionsPanel } from '@/components/campus-agent/suggestions-panel'
import { ChatInterface } from '@/components/campus-agent/chat-interface'
import { WeekCalendar } from '@/components/campus-agent/week-calendar'
import { GroupTab } from '@/components/campus-agent/group-tab'
import { generateSuggestions } from '@/lib/agent'
import type { CalendarEvent, EventSuggestion } from '@/lib/mockData'

interface CampusAgentClientProps {
  calendarEvents: CalendarEvent[]
  initialSuggestions?: EventSuggestion[]
  userName?: string
  userEmail?: string
  profileInterests?: string[]
}

export default function CampusAgentClient({
  calendarEvents,
  initialSuggestions,
  userName,
  userEmail,
  profileInterests,
}: CampusAgentClientProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'group'>('suggestions')
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>(
    initialSuggestions ?? [],
  )
  const [isLoading, setIsLoading] = useState(
    !initialSuggestions || initialSuggestions.length === 0,
  )
  const [addedEventIds, setAddedEventIds] = useState<Set<string>>(new Set())

  // If we got server-rendered suggestions, just clear the loading flag.
  // Otherwise fall back to the local mock generator (legacy path).
  useEffect(() => {
    if (initialSuggestions && initialSuggestions.length > 0) {
      setIsLoading(false)
      return
    }
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions())
      setIsLoading(false)
    }, 1200)
    return () => clearTimeout(timer)
  }, [initialSuggestions])

  const handleReset = useCallback(() => {
    setIsLoading(true)
    setAddedEventIds(new Set())
    setSuggestions([])
    setActiveTab('suggestions')

    setTimeout(() => {
      // On reset, fall back to the local generator. (Real-data refresh
      // would re-call the server action — wire that in when ready.)
      setSuggestions(initialSuggestions ?? generateSuggestions())
      setIsLoading(false)
    }, 1200)
  }, [initialSuggestions])

  const handleAddToCalendar = useCallback((eventId: string) => {
    setAddedEventIds((prev) => new Set([...prev, eventId]))
  }, [])

  const handleTellMeMore = useCallback((eventId: string) => {
    console.log('[Nudge] Tell me more about event:', eventId)
  }, [])

  const handleApproveRearrangement = useCallback(
    (eventId: string) => {
      handleAddToCalendar(eventId)
    },
    [handleAddToCalendar],
  )

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
      />

      {activeTab === 'suggestions' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - 60% */}
          <div className="flex w-[60%] flex-col overflow-hidden border-r border-border">
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

            <div className="flex-1 overflow-hidden p-4">
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
      ) : (
        <div className="flex-1 overflow-auto">
          <GroupTab onBack={() => setActiveTab('suggestions')} />
        </div>
      )}
    </div>
  )
}
