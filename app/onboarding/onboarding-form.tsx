"use client"

import { useState, useTransition } from "react"
import { saveOnboarding } from "./actions"

interface InterestOption {
  id: string
  label: string
  emoji: string
}

interface Props {
  options: InterestOption[]
}

export default function OnboardingForm({ options }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bio, setBio] = useState("")
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    selected.forEach((id) => fd.append("interests", id))
    fd.set("bio", bio)
    startTransition(() => {
      saveOnboarding(fd)
    })
  }

  const minSelected = selected.size >= 3
  const canSubmit = minSelected && !isPending

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Pick at least 3 interests
          </h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {selected.size} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {options.map((opt) => {
            const isOn = selected.has(opt.id)
            return (
              <button
                type="button"
                key={opt.id}
                onClick={() => toggle(opt.id)}
                className={[
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition",
                  isOn
                    ? "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-200 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-100 dark:ring-blue-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                ].join(" ")}
              >
                <span className="text-lg" aria-hidden>
                  {opt.emoji}
                </span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <label
          htmlFor="bio"
          className="mb-2 block text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          Anything else? (optional)
        </label>
        <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          One line about what you're working on, looking for, or trying to
          avoid. Nudge uses this to filter recommendations.
        </p>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          placeholder="e.g. NYU sophomore, recruiting for IB Summer 2026, building a side project, no Wednesday night events"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <div className="mt-1 text-right text-xs text-slate-400">
          {bio.length} / 500
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-800">
        {!minSelected && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Pick {3 - selected.size} more to continue
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {isPending ? "Saving..." : "Continue to Nudge"}
        </button>
      </div>
    </form>
  )
}
