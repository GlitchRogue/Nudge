'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/campus-agent/top-nav'
import { SuggestionsPanel } from '@/components/campus-agent/suggestions-panel'
import { ChatInterface } from '@/components/campus-agent/chat-interface'
import { WeekCalendar } from '@/components/campus-agent/week-calendar'
import { GroupTab } from '@/components/campus-agent/group-tab'
import { generateSuggestions } from '@/lib/agent'
import { calendarEvents, EventSuggestion } from '@/lib/mockData'

export default function CampusAgentPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'group'>('suggestions')
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addedEventIds, setAddedEventIds] = useState<Set<string>>(new Set())

  // Auth gate: redirect to /login if user hasn't "connected" their calendar
  useEffect(() => {
    try {
      const user = localStorage.getItem('nudge-user')
      if (!user) {
        router.replace('/login')
        return
      }
      setAuthChecked(true)
    } catch (e) {
      // localStorage unavailable (e.g. SSR); default to letting them in
      setAuthChecked(true)
    }
  }, [router])

  // Generate suggestions on mount (only after auth check passes)
  useEffect(() => {
    if (!authChecked) return
    const timer = setTimeout(() => {
      setSuggestions(generateSuggestions())
      setIsLoading(false)
    }, 1200)

    return () => clearTimeout(timer)
  }, [authChecked])

  const handleReset = useCallback(() => {
    setIsLoading(true)
    setAddedEventIds(new Set())
    setSuggestions([])
    setActiveTab('suggestions')

    setTimeout(() => {
      setSuggestions(generateSuggestions())
      setIsLoading(false)
    }, 1200)
  }, [])

  const handleAddToCalendar = useCallback((eventId: string) => {
    setAddedEventIds((prev) => new Set([...prev, eventId]))
  }, [])

  const handleTellMeMore = useCallback((eventId: string) => {
    // This would scroll to chat and send a message
    console.log('[v0] Tell me more about event:', eventId)
  }, [])

  const handleApproveRearrangement = useCallback((eventId: string) => {
    // Approve the rearrangement and add to calendar
    handleAddToCalendar(eventId)
  }, [handleAddToCalendar])

  // Show a blank screen while we check auth (prevents flash of content before redirect)
  if (!authChecked) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

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
            {/* Suggestions - scrollable */}
            <div className="flex-shrink-0 overflow-auto border-b border-border p-4" style={{ maxHeight: '45%' }}>
              <SuggestionsPanel
                suggestions={suggestions}
                isLoading={isLoading}
                addedEventIds={addedEventIds}
                onAddToCalendar={handleAddToCalendar}
                onTellMeMore={handleTellMeMore}
                onApproveRearrangement={handleApproveRearrangement}
              />
            </div>

            {/* Chat - fills remaining space */}
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
