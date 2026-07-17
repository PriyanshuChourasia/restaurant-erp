import { ReactNode } from 'react'
import { Outlet, Link } from '@tanstack/react-router'
import { Home, CookingPot } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface KOTLayoutProps {
  children?: ReactNode
}

export function KOTLayout({ children }: KOTLayoutProps) {
  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* KOT header */}
      <header className="flex h-11 sm:h-14 items-center gap-2 sm:gap-3 border-b border-border bg-card px-3 sm:px-4 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          title="Exit to Dashboard"
          render={<Link to="/dashboard" />}
        >
          <Home size={16} className="sm:hidden" />
          <Home size={18} className="hidden sm:block" />
        </Button>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <CookingPot size={16} className="text-orange-500 sm:hidden" />
          <CookingPot size={20} className="text-orange-500 hidden sm:block" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">KOT Terminal</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Live Kitchen Display</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {children || <Outlet />}
      </main>
    </div>
  )
}
