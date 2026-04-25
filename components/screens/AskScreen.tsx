"use client"

import { useState } from 'react'

interface Message { from: 'user' | 'bot'; text: string }

const QUICKS = ["I'm free 1-2pm", "Show me free food", "Networking for CS", "I'm bored"]

function botReply(text: string): string {
  const t = text.toLowerCase()
  if (/(food|hungry|eat)/.test(t))
    return "Free Halal Cart lunch outside Bobst at 12. Then Stern Pizza & Markets talk at 5:30 (Finance match)."
  if (/(1\s*-?\s*2|one to two)/.test(t))
    return "You have a 1hr slot. Wasserman Coffee Chat at 1pm — Google & Palantir recruiters. Want me to add it?"
  if (/(network|career)/.test(t))
    return "Top picks: Wasserman Coffee Chat at 1pm and Google Engineering Meetup at 4pm. Both match your CS interest."
  if (/(bored|fun)/.test(t))
    return "Pottery Pop-Up at 1:30pm at Tisch Arts. Or hackathon launch party Sunday 9pm at Tandon."
  return "I can find food, networking, popups, or fun things based on your free time. Try 'I'm free 3-5' or 'show me design events'."
}

export function AskScreen() {
  const [chat, setChat] = useState<Message[]>([
    { from: 'bot', text: "Hi! I'm Nudge. Tell me when you're free and I'll match it to your interests." },
  ])
  const [input, setInput] = useState('')

  function send(text: string) {
    if (!text.trim()) return
    setChat(prev => [...prev, { from: 'user', text }, { from: 'bot', text: botReply(text) }])
    setInput('')
  }

  return (
    <>
      <p className="text-[11px] text-app-muted tracking-[0.08em] font-medium mb-3">ASK ANYTHING</p>
      <div className="flex flex-col gap-2 mb-3.5">
        {chat.map((m, idx) => (
          <div
            key={idx}
            className={`px-3 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-snug ${
              m.from === 'bot'
                ? 'bg-app-card border border-app-border self-start rounded-bl-md'
                : 'bg-brand text-white self-end rounded-br-md'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {QUICKS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => send(q)}
            className="text-[12px] px-2.5 py-1.5 rounded-full border border-app-border-strong bg-app-card text-app-text font-medium"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center bg-app-card border border-app-border rounded-full pl-3.5 pr-1.5 py-1.5">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Type a message…"
          className="flex-1 bg-transparent outline-none text-[13px] h-8"
        />
        <button
          type="button"
          onClick={() => send(input)}
          className="text-[12px] px-3.5 py-1.5 rounded-full bg-brand text-white font-medium"
        >
          Send
        </button>
      </div>
    </>
  )
}