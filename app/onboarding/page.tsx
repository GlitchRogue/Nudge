import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { getProfile, INTEREST_OPTIONS } from "@/lib/profile"
import OnboardingForm from "./onboarding-form"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  // If they already have a profile, send them to the home page.
  const existing = await getProfile()
  if (existing) {
    redirect("/")
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Welcome to Nudge
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
            Hey {session.user.name?.split(" ")[0] ?? "there"} — what are you into?
          </h1>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Pick a few interests so Nudge can suggest events that actually fit
            your life. You can change these anytime from your profile.
          </p>
        </div>

        <OnboardingForm options={INTEREST_OPTIONS} />
      </div>
    </main>
  )
}
