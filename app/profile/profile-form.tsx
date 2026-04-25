"use client"

import { useState, useTransition } from "react"
import type { NudgeProfile } from "@/lib/profile"
import { updateProfile } from "./actions"

interface InterestOption {
  id: string
  label: string
  emoji: string
}

interface Props {
  profile: NudgeProfile
  options: InterestOption[]
}

export default function ProfileForm({ profile, options }: Props) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(profile.interests),
  )
  const [bio, setBio] = useState(profile.bio)
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
    fd.set("createdAt", profile.createdAt)
    startTransition(() => {
      updateProfile(fd)
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
    >
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Interests
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
          className="mb-2 block text-base font-semibold text-slate-900 dark:text-slate-100"
        >
          About you
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <div className="mt-1 text-right text-xs text-slate-400">
          {bio.length} / 500
        </div>
      </section>

      <div className="flex items-center justify-end border-t border-slate-200 pt-6 dark:border-slate-800">
        <button
          type="submit"
          disabled={isPending || selected.size === 0}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 dark:disabled:text-slate-400"
        >
          {isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  )
}
