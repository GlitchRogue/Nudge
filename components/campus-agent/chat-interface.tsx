'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const QUICKS = ["I'm free 1-2pm", "Show me free food", "Networking for CS", "I'm bored"]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggestedIds?: string[]
}

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void
  onAddEvent?: (eventId: string) => void
  addedEventIds?: Set<string>
  suggestionTitleMap?: Record<string, string>
}

export function ChatInterface({ onSendMessage, onAddEvent, addedEventIds, suggestionTitleMap }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming])

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setIsStreaming(true)
    onSendMessage?.(text)

    try {
      const r = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = (await r.json()) as { reply?: string; suggested_event_ids?: string[] }
      const replyText =
        data.reply?.trim() ||
        "I'm having trouble responding right now. Try rephrasing?"
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: replyText,
          suggestedIds: data.suggested_event_ids ?? [],
        },
      ])
    } catch (err) {
      console.warn('[chat] fetch failed', err)
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: "Network hiccup — try again in a moment.",
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(input)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
        ASK ANYTHING
      </p>

      <div className="mb-3.5 flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {messages.length === 0 ? (
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-app-border bg-app-card px-3 py-2.5 text-[13px] leading-snug text-app-text">
            Hi, I&apos;m Nudge. Tell me when you&apos;re free and I&apos;ll match it to your interests.
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={cn('flex flex-col gap-1.5', m.role === 'assistant' ? 'items-start' : 'items-end')}>
              <div
                className={cn(
                  'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-[13px] leading-snug',
                  m.role === 'assistant'
                    ? 'rounded-bl-md border border-app-border bg-app-card text-app-text'
                    : 'rounded-br-md bg-brand text-white',
                )}
              >
                {m.content}
              </div>
              {m.role === 'assistant' && m.suggestedIds && m.suggestedIds.length > 0 && onAddEvent && (
                <div className="flex max-w-[85%] flex-wrap gap-1.5">
                  {m.suggestedIds.map((id) => {
                    const isAdded = addedEventIds?.has(id) ?? false
                    const title = suggestionTitleMap?.[id]
                    if (!title) return null
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => onAddEvent(id)}
                        className={cn(
                          'rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition active:scale-95',
                          isAdded
                            ? 'border-brand bg-white text-brand'
                            : 'border-brand bg-brand text-white hover:opacity-90'
                        )}
                      >
                        {isAdded ? '✓ Added: ' : '+ Add: '}{title.length > 30 ? title.slice(0, 30) + '…' : title}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))
        )}
        {isStreaming && (
          <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md border border-app-border bg-app-card px-3 py-2.5 text-[13px] text-app-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {QUICKS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => handleSubmit(q)}
            disabled={isStreaming}
            className="flex-shrink-0 rounded-full border border-app-border-strong bg-app-card px-2.5 py-1.5 text-[12px] font-medium text-app-text transition hover:bg-app-surface disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 rounded-full border border-app-border bg-app-card py-1.5 pl-3.5 pr-1.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="h-8 flex-1 bg-transparent text-[13px] text-app-text outline-none placeholder:text-app-subtle"
          disabled={isStreaming}
        />
        <button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="rounded-full bg-brand px-3.5 py-1.5 text-[12px] font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}
