'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

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
  const brandColor = isDark ? '#2EAB8B' : '#0F6E56'
  const arrowColor = '#E85D4C'

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
          stroke={brandColor}
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Arrow stem */}
        <path
          d="M28 16L36 4"
          stroke={arrowColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Arrow head */}
        <path
          d="M32 3L37 4L36 9"
          stroke={arrowColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    )
  }

  // Full logo with mark + wordmark as SVG
  return (
    <svg
      viewBox="0 0 180 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* The stylized "n" mark */}
      <path
        d="M4 40V24C4 14.059 12.059 6 22 6V6C31.941 6 40 14.059 40 24V40"
        stroke={brandColor}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Arrow stem */}
      <path
        d="M30 18L40 6"
        stroke={arrowColor}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Arrow head */}
      <path
        d="M35 5L41 6L40 12"
        stroke={arrowColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Wordmark "nudge" */}
      <text
        x="52"
        y="34"
        fill={brandColor}
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="28"
        fontWeight="600"
        letterSpacing="-0.5"
      >
        nudge
      </text>
    </svg>
  )
}
