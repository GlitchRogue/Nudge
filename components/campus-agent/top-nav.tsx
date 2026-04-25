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
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">CA</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Campus Agent</span>
        </div>

        <nav className="flex items-center gap-1">
          <Button
            variant={activeTab === 'suggestions' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('suggestions')}
            className="text-sm"
          >
            Suggestions
          </Button>
          <Button
            variant={activeTab === 'group' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onTabChange('group')}
            className="text-sm"
          >
            Group
          </Button>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
          <span className="text-xs font-medium text-success">Agent active</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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

        {/* Profile - now visible in top bar */}
        <Link href={profileUrl} className="flex items-center gap-2 rounded-full border border-border px-2 py-1 transition-colors hover:bg-muted">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight text-foreground">{userName || 'User'}</span>
            {userEmail && (
              <span className="text-xs leading-tight text-muted-foreground">{userEmail}</span>
            )}
          </div>
        </Link>
      </div>
    </header>
  )
}
