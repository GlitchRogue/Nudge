import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getProfile, INTEREST_OPTIONS } from "@/lib/profile"
import { userProfile as mockUserProfile } from "@/lib/mockData"
import ProfileForm from "./profile-form"
import { resetProfile, signOutAction } from "./actions"

interface PageProps {
  searchParams: Promise<{ saved?: string; demo?: string }>
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const params = await searchParams
  const isDemo = params.demo === "1"
  const justSaved = params.saved === "1"

  // Demo mode: use mock data
  if (isDemo) {
    const mockProfile = {
      interests: mockUserProfile.interests,
      bio: "CS junior passionate about AI/ML and building cool things. Love playing basketball and capturing moments through photography.",
      createdAt: "2026-01-15T00:00:00.000Z",
    }
    const mockSession = {
      user: {
        name: mockUserProfile.name,
        email: "demo@stanford.edu",
        image: null,
      },
    }

    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/?demo=1"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            >
              ← Back to Nudge
            </Link>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              Demo Mode
            </span>
          </div>

          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              {mockUserProfile.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {mockSession.user.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {mockSession.user.email}
              </p>
            </div>
          </div>

          {justSaved && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
              Saved.
            </div>
          )}

          <ProfileForm profile={mockProfile} options={INTEREST_OPTIONS} />

          <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Connected accounts
            </h2>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-lg" aria-hidden>📅</span>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Google Calendar
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mockSession.user.email}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
                Connected
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
            <h2 className="text-base font-semibold text-amber-900 dark:text-amber-200">
              Demo Mode
            </h2>
            <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
              Changes made in demo mode are not saved. Sign in with Google to use your real profile.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const session = await auth()
  if (!session?.user) redirect("/login")

  const profile = await getProfile()
  if (!profile) redirect("/onboarding")

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            ← Back to Nudge
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mb-8 flex items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-16 w-16 rounded-full border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {session.user.name ?? "Your profile"}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {session.user.email}
            </p>
          </div>
        </div>

        {justSaved && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-200">
            Saved.
          </div>
        )}

        <ProfileForm profile={profile} options={INTEREST_OPTIONS} />

        <div className="mt-10 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Connected accounts
          </h2>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-lg" aria-hidden>📅</span>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Google Calendar
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {session.user.email}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
              Connected
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
          <h2 className="text-base font-semibold text-red-900 dark:text-red-200">
            Reset profile
          </h2>
          <p className="mt-1 text-sm text-red-800/80 dark:text-red-300/80">
            Clears your interests and re-runs onboarding. Your Google sign-in
            stays connected.
          </p>
          <form action={resetProfile} className="mt-3">
            <button
              type="submit"
              className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:bg-red-950 dark:text-red-200 dark:hover:bg-red-900/40"
            >
              Redo onboarding
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
