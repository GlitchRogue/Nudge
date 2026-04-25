import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Refresh an expired Google access token using the stored refresh_token.
 * Returns a new token object (with updated accessToken + expiresAt) or
 * the original token with an `error` flag if refresh fails.
 */
async function refreshGoogleAccessToken(token: any) {
  try {
    if (!token.refreshToken) {
      console.warn("[Nudge auth] No refresh token available — cannot refresh")
      return { ...token, error: "NoRefreshToken" }
    }

    const params = new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      grant_type: "refresh_token",
      refresh_token: token.refreshToken as string,
    })

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const data = await res.json()
    if (!res.ok) {
      console.error("[Nudge auth] Refresh failed:", data)
      return { ...token, error: "RefreshAccessTokenError" }
    }

    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
      // Google may rotate the refresh token; keep old one if not returned
      refreshToken: data.refresh_token ?? token.refreshToken,
      error: undefined,
    }
  } catch (err) {
    console.error("[Nudge auth] Refresh threw:", err)
    return { ...token, error: "RefreshAccessTokenError" }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          // Request offline access + Calendar read scope
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    // Persist Google access token + refresh on expiry
    async jwt({ token, account }) {
      // Initial sign-in: account is present
      if (account?.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        // account.expires_at is unix seconds
        token.expiresAt = account.expires_at ?? Math.floor(Date.now() / 1000) + 3600
        return token
      }

      // Subsequent calls: check if accessToken is still valid (60s buffer)
      const expiresAt = (token.expiresAt as number | undefined) ?? 0
      if (Date.now() / 1000 < expiresAt - 60) {
        return token
      }

      // Token expired — attempt refresh
      return await refreshGoogleAccessToken(token)
    },
    // Expose access token + error on the session so server can react
    async session({ session, token }) {
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      if (token.error) {
        ;(session as any).error = token.error
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
