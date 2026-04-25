'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CampusAgentMessage } from '@/app/api/chat/route'

const QUICKS = ["I'm free 1-2pm", "Show me free food", "Networking for CS", "I'm bored"]

interface ChatInterfaceProps {
  onSendMessage?: (message: string) => void
}

export function ChatInterface({ onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat<CampusAgentMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (text: string) => {
    if (!text.trim() || status !== 'ready') return
    sendMessage({ text })
    onSendMessage?.(text)
    setInput('')
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(input)
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Section header */}
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-app-muted">
        ASK ANYTHING
      </p>

      {/* Messages */}
      <div className="mb-3.5 flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
        {messages.length === 0 ? (
          <div className="max-w-[85%] self-start rounded-2xl rounded-bl-md border border-app-border bg-app-card px-3 py-2.5 text-[13px] leading-snug text-app-text">
            Hi! I&apos;m Nudge. Tell me when you&apos;re free and I&apos;ll match it to your interests.
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
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

      {/* Quick replies */}
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

      {/* Input */}
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2 rounded-full border border-app-border bg-app-card py-1.5 pl-3.5 pr-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(input)}
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

function MessageBubble({ message }: { message: CampusAgentMessage }) {
  const isAssistant = message.role === 'assistant'

  return (
    <>
      {message.parts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div
              key={index}
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2.5 text-[13px] leading-snug',
                isAssistant 
                  ? 'self-start rounded-bl-md border border-app-border bg-app-card text-app-text' 
                  : 'self-end rounded-br-md bg-brand text-white'
              )}
            >
              {part.text}
            </div>
          )
        }

        // Tool calls
        if (part.type.startsWith('tool-')) {
          return <ToolCallDisplay key={index} part={part} />
        }

        return null
      })}
    </>
  )
}

function ToolCallDisplay({ part }: { part: CampusAgentMessage['parts'][number] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toolName = part.type.replace('tool-', '')
  const state = 'state' in part ? part.state : 'output-available'
  const isLoading = state === 'input-streaming' || state === 'input-available'

  return (
    <div className="w-full self-start rounded-xl border border-app-border bg-app-surface text-[12px]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-3 w-3 animate-spin text-brand" />
          ) : (
            <div className="h-2 w-2 rounded-full bg-brand" />
          )}
          <span className="font-medium text-app-muted">
            {toolName}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-app-muted" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-app-muted" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-app-border px-3 py-2">
          {'input' in part && part.input && (
            <div className="mb-2">
              <span className="text-[10px] font-medium text-app-muted">Input:</span>
              <pre className="mt-1 overflow-auto rounded-lg bg-app-card p-2 text-[10px]">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {'output' in part && part.output && (
            <div>
              <span className="text-[10px] font-medium text-app-muted">Output:</span>
              <pre className="mt-1 overflow-auto rounded-lg bg-app-card p-2 text-[10px]">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
