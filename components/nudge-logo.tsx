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
    // For mark, use a cropped portion of the logo or render as part of the full image
    // Since we don't have separate mark images, we'll use the full image with object-fit
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={isDark ? '/logo-dark.png' : '/logo-light.png'}
          alt="Nudge"
          width={120}
          height={48}
          className="h-full w-auto object-contain object-left"
          style={{ 
            clipPath: 'inset(0 65% 0 0)',
            transform: 'scale(1.5)',
            transformOrigin: 'left center'
          }}
          priority
        />
      </div>
    )
  }

  // Full logo with wordmark
  return (
    <>
      {/* Light mode logo */}
      <Image
        src="/logo-light.png"
        alt="Nudge"
        width={160}
        height={55}
        className={`${className} ${isDark ? 'hidden' : 'block'}`}
        priority
      />
      {/* Dark mode logo */}
      <Image
        src="/logo-dark.png"
        alt="Nudge"
        width={160}
        height={55}
        className={`${className} ${isDark ? 'block' : 'hidden'}`}
        priority
      />
    </>
  )
}
