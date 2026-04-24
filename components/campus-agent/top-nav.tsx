'use client'

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

interface TopNavProps {
  activeTab: 'suggestions' | 'group'
  onTabChange: (tab: 'suggestions' | 'group') => void
  onReset: () => void
}

export function TopNav({ activeTab, onTabChange, onReset }: TopNavProps) {
  const { theme, setTheme } = useTheme()

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
      </div>
    </header>
  )
}
