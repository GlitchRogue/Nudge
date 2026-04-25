import Link from "next/link"
import { redirect } from "next/navigation"
import { auth, signIn } from "@/auth"

export default async function LoginPage() {
  // If they're already signed in, send them to the app
  const session = await auth()
  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-app-surface p-4">
      <div className="w-full max-w-sm space-y-8 rounded-3xl border border-app-border bg-app-bg p-8 shadow-sm">
        {/* Brand */}
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-app-text">Nudge</h1>
            <p className="mt-1 text-sm text-app-subtle">
              Your AI scheduling assistant
            </p>
          </div>
        </div>

        {/* Sign-in */}
        <div className="space-y-3">
          <form
            action={async () => {
              "use server"
              await signIn("google", { redirectTo: "/" })
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-app-border bg-white px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50 dark:bg-app-card dark:text-app-text dark:hover:bg-app-muted"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </form>
          
          <p className="text-center text-xs text-app-subtle">
            We&apos;ll read your calendar to find events that fit your schedule.
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-app-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-app-bg px-3 text-app-subtle">or</span>
          </div>
        </div>

        {/* Demo Button */}
        <Link
          href="/?demo=1"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Try Demo
        </Link>

        <p className="text-center text-[11px] text-app-subtle">
          Demo mode uses sample data to showcase the app
        </p>
      </div>
    </div>
  )
}
