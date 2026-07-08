import { ReactNode, useState } from 'react'
import { Bell, Search, Settings, LogOut } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

interface DashboardHeaderProps {
  children?: ReactNode
}

export function DashboardHeader({ children }: DashboardHeaderProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background px-4">
      {children}

      <div className="flex flex-1 items-center gap-2 max-w-md">
        <Search size={16} className="text-muted-foreground shrink-0" />
        <Input
          type="search"
          placeholder="Search..."
          className="h-8 border-none bg-muted/50 shadow-none focus-visible:bg-background"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell size={18} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground" render={<Link to="/settings" />}>
          <Settings size={18} />
        </Button>
        <div className="relative flex items-center gap-2 pl-2 border-l border-border">
          <button
            onClick={() => setShowLogout(!showLogout)}
            className="flex items-center gap-2 rounded-md hover:bg-muted/50 p-1 -m-1 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight text-foreground">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground leading-tight capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
          </button>

          {showLogout && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowLogout(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 w-44 rounded-lg border border-border bg-popover p-1 shadow-lg">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border mb-1">
                  {user?.email || ''}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
