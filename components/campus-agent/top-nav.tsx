'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Settings, Moon, Sun, RotateCcw } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface TopNavProps {
  activeTab: 'suggestions' | 'group'
  onTabChange: (tab: 'suggestions' | 'group') => void
  onReset: () => void
  userName?: string
  userEmail?: string
}

export function TopNav({ activeTab, onTabChange, onReset, userName, userEmail }: TopNavProps) {
  const { theme, setTheme } = useTheme()
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') === '1'
  
  // Get initials from name
  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  // Profile URL - preserves demo mode if active
  const profileUrl = isDemo ? '/profile?demo=1' : '/profile'

  return (
    <header className="flex flex-col gap-2 border-b border-border bg-card px-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-3">
      {/* Top row: Logo + Nav + Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary sm:h-8 sm:w-8">
              <span className="text-xs font-bold text-primary-foreground sm:text-sm">CA</span>
            </div>
            <span className="text-base font-semibold text-foreground sm:text-lg">Nudge</span>
          </div>

          <nav className="flex items-center gap-1">
            <Button
              variant={activeTab === 'suggestions' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('suggestions')}
              className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              Suggestions
            </Button>
            <Button
              variant={activeTab === 'group' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onTabChange('group')}
              className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
            >
              Group
            </Button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Agent status - hidden on small screens */}
          <div className="hidden items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 sm:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
            </span>
            <span className="text-xs font-medium text-success">Agent active</span>
          </div>

          {/* Mobile: just show green dot */}
          <div className="flex items-center sm:hidden">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? (
                  <>
                    <Sun className="mr-2 h-4 w-4" />
                    Light mode
                  </>
                ) : (
                  <>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark mode
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile - compact on mobile */}
          <Link href={profileUrl} className="flex items-center gap-1.5 rounded-full border border-border px-1.5 py-1 transition-colors hover:bg-muted sm:gap-2 sm:px-2">
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
              <AvatarFallback className="bg-primary text-[10px] text-primary-foreground sm:text-xs">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            {/* Show name only on larger screens */}
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-medium leading-tight text-foreground">{userName || 'User'}</span>
              {userEmail && (
                <span className="text-xs leading-tight text-muted-foreground">{userEmail}</span>
              )}
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
