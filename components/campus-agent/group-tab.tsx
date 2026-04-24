'use client'

import { useState, useEffect } from 'react'
import { Users, Sparkles, Send, Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  groupMembers,
  availableEvents,
  sourceBadgeColors,
  formatEventTime,
  formatEventDate,
} from '@/lib/mockData'

interface GroupTabProps {
  onBack: () => void
}

// Find an event that could match multiple people (for demo)
const groupMatchEvent = availableEvents.find((e) => e.id === 'ev-6') || availableEvents[5] // Weekend Hackathon

export function GroupTab({ onBack }: GroupTabProps) {
  const [showMatch, setShowMatch] = useState(false)
  const [showDraftMessage, setShowDraftMessage] = useState(false)
  const [showGroupChat, setShowGroupChat] = useState(false)
  const [celebrationVisible, setCelebrationVisible] = useState(false)

  useEffect(() => {
    // Simulate finding a group match after a delay
    const matchTimer = setTimeout(() => {
      setShowMatch(true)
      setCelebrationVisible(true)
      setTimeout(() => setCelebrationVisible(false), 2000)
    }, 1500)

    return () => clearTimeout(matchTimer)
  }, [])

  const handlePropose = () => {
    setShowDraftMessage(true)
    setTimeout(() => {
      setShowGroupChat(true)
    }, 1000)
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Group Scheduling</h2>
        </div>
        <Badge variant="secondary" className="text-xs">
          3 friends connected
        </Badge>
      </div>

      {/* Friend agents */}
      <div className="grid gap-4 md:grid-cols-2">
        {groupMembers.map((member) => (
          <Card key={member.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{member.name}</span>
                    <span className="flex items-center gap-1 text-xs text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      Agent active
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {member.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Group match section */}
      <div className="relative flex-1">
        {!showMatch ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              <span className="text-sm text-muted-foreground">
                Looking for events that match everyone...
              </span>
            </div>
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-primary"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Celebration animation */}
            {celebrationVisible && (
              <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
                <div className="animate-ping text-4xl">✨</div>
              </div>
            )}

            {/* Match card */}
            <Card className={cn(
              'overflow-hidden border-2 border-success transition-all duration-500',
              celebrationVisible && 'scale-105'
            )}>
              <div className="bg-success/10 px-4 py-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Matched 3 of you!</span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge
                      variant="secondary"
                      className={cn('mb-2 text-xs', sourceBadgeColors[groupMatchEvent.source])}
                    >
                      {groupMatchEvent.source}
                    </Badge>
                    <h3 className="text-lg font-semibold text-foreground">
                      {groupMatchEvent.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {groupMatchEvent.description}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatEventDate(groupMatchEvent.startTime)}</span>
                      <span>{formatEventTime(groupMatchEvent.startTime)}</span>
                      <span>{groupMatchEvent.location}</span>
                    </div>

                    {/* Who it matches */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Perfect for:</span>
                      <div className="flex -space-x-2">
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                            AC
                          </AvatarFallback>
                        </Avatar>
                        {groupMembers.map((member) => (
                          <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                              {member.avatar}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-success/10 text-success">
                    <span className="text-xl font-bold">92</span>
                    <span className="text-[10px] uppercase tracking-wide opacity-70">match</span>
                  </div>
                </div>

                {!showDraftMessage && (
                  <Button className="mt-4 w-full" onClick={handlePropose}>
                    <Send className="mr-2 h-4 w-4" />
                    Propose to group chat
                  </Button>
                )}

                {showDraftMessage && (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground">Draft message:</p>
                      <p className="mt-1 text-sm text-foreground">
                        &quot;Hey! Found an event that matches all of us - Weekend Hackathon this
                        Saturday. It has an AI/ML track and $5000 in prizes. Want to form a team?&quot;
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Check className="mr-2 h-4 w-4" />
                      Message sent!
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mock group chat */}
            {showGroupChat && (
              <Card className="animate-in slide-in-from-bottom-4 duration-300">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Group Chat Preview</span>
                  </div>

                  <div className="space-y-3">
                    <ChatMessage
                      avatar="AC"
                      name="You"
                      message="Hey! Found an event that matches all of us - Weekend Hackathon this Saturday. It has an AI/ML track and $5000 in prizes. Want to form a team?"
                      isYou
                    />
                    <ChatMessage
                      avatar="JT"
                      name="Friend A"
                      message="Yes!! I've been wanting to try the new Claude API. Count me in! 🙋‍♂️"
                      delay={800}
                    />
                    <ChatMessage
                      avatar="SK"
                      name="Friend B"
                      message="Perfect timing, I need to build something for my portfolio. Let's do it!"
                      delay={1600}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ChatMessage({
  avatar,
  name,
  message,
  isYou = false,
  delay = 0,
}: {
  avatar: string
  name: string
  message: string
  isYou?: boolean
  delay?: number
}) {
  const [visible, setVisible] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!visible) return null

  return (
    <div className={cn(
      'flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
      isYou && 'flex-row-reverse'
    )}>
      <Avatar className="h-7 w-7">
        <AvatarFallback className={cn(
          'text-[10px]',
          isYou ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
        )}>
          {avatar}
        </AvatarFallback>
      </Avatar>
      <div className={cn(
        'max-w-[75%] rounded-lg px-3 py-2',
        isYou ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
      )}>
        <p className="mb-0.5 text-[10px] font-medium opacity-70">{name}</p>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  )
}
