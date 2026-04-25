"use client"

import { useProfile } from '@/lib/profile-store'

const SCHOOLS = ['Stanford University', 'New York University', 'Columbia University', 'MIT', 'UC Berkeley']
const ALL_INTERESTS = ['AI/ML', 'entrepreneurship', 'basketball', 'photography', 'hackathons', 'design', 'music', 'finance', 'gaming', 'volunteering']

const PLATFORMS = [
  { key: 'Eventbrite'    as const, name: 'Eventbrite',    desc: 'Public events & meetups' },
  { key: 'Campus Portal' as const, name: 'Campus Portal', desc: 'Official campus events' },
  { key: 'Career Center' as const, name: 'Career Center', desc: 'Career postings & info sessions' },
  { key: 'Newsletter'    as const, name: 'Newsletter',    desc: 'Weekly digest events' },
]

export function SettingsScreen() {
  const { user, school, connections, interests, toggleInterest, setSchool, toggleConnection } = useProfile()

  return (
    <>
      <section className="mb-5">
        <p className="text-[11px] text-app-muted tracking-[0.06em] font-medium mb-2">PROFILE</p>
        <div className="px-3.5 py-3 bg-app-card border border-app-border rounded-xl">
          <div className="text-[13px] font-medium">{user.name}</div>
          <div className="text-[11px] text-app-muted mt-0.5">{user.major} · {user.year}</div>
        </div>
      </section>

      <section className="mb-5">
        <p className="text-[11px] text-app-muted tracking-[0.06em] font-medium mb-2">SCHOOL</p>
        <select value={school} onChange={e => setSchool(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-app-border-strong bg-app-card text-[13px]">
          {SCHOOLS.map(s => <option key={s}>{s}</option>)}
        </select>
      </section>

      <section className="mb-5">
        <p className="text-[11px] text-app-muted tracking-[0.06em] font-medium mb-2">CONNECTED PLATFORMS</p>
        {PLATFORMS.map(p => (
          <div key={p.key} className="flex justify-between items-center px-3.5 py-3 bg-app-card border border-app-border rounded-xl mb-1.5 gap-2.5">
            <div>
              <div className="text-[13px] font-medium">{p.name}</div>
              <div className="text-[11px] text-app-muted mt-0.5">{p.desc}</div>
            </div>
            <button
              type="button"
              onClick={() => toggleConnection(p.key)}
              className={`text-[12px] px-3 py-1.5 rounded-full border font-medium flex-shrink-0 transition ${connections[p.key] ? 'bg-brand text-white border-brand' : 'bg-transparent text-app-text border-app-border-strong'}`}
            >
              {connections[p.key] ? 'Connected' : 'Connect'}
            </button>
          </div>
        ))}
      </section>

      <section className="mb-5">
        <p className="text-[11px] text-app-muted tracking-[0.06em] font-medium mb-2">INTERESTS</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_INTERESTS.map(i => {
            const on = interests.includes(i)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleInterest(i)}
                className={`text-[12px] px-3 py-2 rounded-full border font-medium transition ${on ? 'bg-brand text-white border-brand' : 'bg-app-card text-app-text border-app-border-strong'}`}
              >
                {i}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-app-muted mt-2">{interests.length} selected — your home feed and weekly lineup are ranked by these.</p>
      </section>
    </>
  )
}