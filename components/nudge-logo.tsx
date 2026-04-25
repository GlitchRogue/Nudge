'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import Image from 'next/image'

interface NudgeLogoProps {
  variant?: 'full' | 'mark'
  className?: string
}

export function NudgeLogo({ variant = 'full', className = '' }: NudgeLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch - show light version by default
  const isDark = mounted && resolvedTheme === 'dark'

  if (variant === 'mark') {
    // SVG mark only (the "n" with arrow)
    return (
      <svg
        viewBox="0 0 48 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* The stylized "n" */}
        <path
          d="M4 36V20C4 11.163 11.163 4 20 4V4C28.837 4 36 11.163 36 20V36"
          stroke={isDark ? '#2EAB8B' : '#0F6E56'}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow stem */}
        <path
          d="M28 16L36 4"
          stroke="#E85D4C"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Arrow head */}
        <path
          d="M32 3L37 4L36 9"
          stroke="#E85D4C"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    )
  }

  // Full logo with wordmark - use actual images
  return (
    <Image
      src={isDark ? '/logo-dark.png' : '/logo-light.png'}
      alt="Nudge"
      width={140}
      height={48}
      className={className}
      priority
    />
  )
}
