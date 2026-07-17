import { ReactNode } from 'react'
import { Outlet, Link } from '@tanstack/react-router'
import { Home, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface POSLayoutProps {
  children?: ReactNode
}

export function POSLayout({ children }: POSLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* POS header */}
      <header className="flex h-14 items-center gap-3 border-b border-border bg-card px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          title="Exit to Dashboard"
          render={<Link to="/dashboard" />}
        >
          <Home size={18} />
        </Button>
        <div className="flex items-center gap-2">
          <Monitor size={20} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">POS Terminal</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Shift: Morning</span>
          <span className="text-xs text-muted-foreground">|</span>
          <span className="text-xs font-medium text-foreground">Server: John D.</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 overflow-hidden">
        {children || <Outlet />}
      </main>
    </div>
  )
}
