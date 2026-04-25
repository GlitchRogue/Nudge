'use client'

import { useState, useEffect } from 'react'
import { formatEventTime, formatEventDate } from '@/lib/mockData'

interface ClientTimeProps {
  date: Date
  showDate?: boolean
}

export function ClientTime({ date, showDate = true }: ClientTimeProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show a placeholder on server/initial render to avoid hydration mismatch
  if (!mounted) {
    return <span>Loading...</span>
  }

  if (showDate) {
    return <span>{formatEventDate(date)}, {formatEventTime(date)}</span>
  }

  return <span>{formatEventTime(date)}</span>
}
