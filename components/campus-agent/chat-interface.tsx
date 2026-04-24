'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Send, ChevronDown, ChevronUp, Bot, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CampusAgentMessage } from '@/app/api/chat/route'

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return
    sendMessage({ text: input })
    onSendMessage?.(input)
    setInput('')
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bot className="h-5 w-5 text-primary" />
        <span className="font-medium text-foreground">Chat with Agent</span>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-3 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              Ask me about events, update your preferences, or get more details about suggestions.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about events..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={isStreaming}
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isStreaming}>
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </form>
    </div>
  )
}

function MessageBubble({ message }: { message: CampusAgentMessage }) {
  const isAssistant = message.role === 'assistant'

  return (
    <div className={cn('flex gap-3', isAssistant ? 'flex-row' : 'flex-row-reverse')}>
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
        isAssistant ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground'
      )}>
        {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>

      <div className={cn(
        'flex max-w-[80%] flex-col gap-1',
        isAssistant ? 'items-start' : 'items-end'
      )}>
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <div
                key={index}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  isAssistant 
                    ? 'bg-muted text-foreground' 
                    : 'bg-primary text-primary-foreground'
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
      </div>
    </div>
  )
}

function ToolCallDisplay({ part }: { part: CampusAgentMessage['parts'][number] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract tool name from part type (e.g., 'tool-searchEvents' -> 'searchEvents')
  const toolName = part.type.replace('tool-', '')

  const getToolLabel = (name: string) => {
    switch (name) {
      case 'searchEvents': return 'Searching events...'
      case 'checkCalendar': return 'Checking calendar...'
      case 'proposeRearrangement': return 'Proposing rearrangement...'
      case 'addToCalendar': return 'Adding to calendar...'
      default: return `Running ${name}...`
    }
  }

  const state = 'state' in part ? part.state : 'output-available'
  const isLoading = state === 'input-streaming' || state === 'input-available'

  return (
    <div className="w-full rounded-lg border border-border bg-muted/50 text-sm">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-3 py-2 text-left"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <div className="h-3.5 w-3.5 rounded-full bg-success" />
          )}
          <span className="font-medium text-muted-foreground">
            Tool: {toolName}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border px-3 py-2">
          {'input' in part && part.input && (
            <div className="mb-2">
              <span className="text-xs font-medium text-muted-foreground">Input:</span>
              <pre className="mt-1 overflow-auto rounded bg-background p-2 text-xs">
                {JSON.stringify(part.input, null, 2)}
              </pre>
            </div>
          )}
          {'output' in part && part.output && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Output:</span>
              <pre className="mt-1 overflow-auto rounded bg-background p-2 text-xs">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
