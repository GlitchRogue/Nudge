"use server"

import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { saveProfile, type NudgeProfile } from "@/lib/profile"

export async function saveOnboarding(formData: FormData) {
  const session = await auth()
  if (!session?.user?.email) {
    redirect("/login")
  }

  const interests = formData.getAll("interests").map((v) => String(v))
  const bio = String(formData.get("bio") ?? "").slice(0, 500)

  const profile: NudgeProfile = {
    email: session.user.email,
    interests,
    bio,
    createdAt: new Date().toISOString(),
  }

  await saveProfile(profile)
  redirect("/")
}
