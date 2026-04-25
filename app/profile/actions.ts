"use server"

import { redirect } from "next/navigation"
import { auth, signOut } from "@/auth"
import { saveProfile, clearProfile, type NudgeProfile } from "@/lib/profile"

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  const interests = formData.getAll("interests").map((v) => String(v))
  const bio = String(formData.get("bio") ?? "").slice(0, 500)
  const createdAt = String(formData.get("createdAt") ?? new Date().toISOString())

  const profile: NudgeProfile = {
    email: session.user.email,
    interests,
    bio,
    createdAt,
  }

  await saveProfile(profile)
  redirect("/profile?saved=1")
}

export async function resetProfile() {
  await clearProfile()
  redirect("/onboarding")
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" })
}
