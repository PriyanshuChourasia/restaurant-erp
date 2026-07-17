import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { DashboardLayout } from '../../../layouts/DashboardLayout'
import { POSLayout } from '../../../layouts/POSLayout'
import { KOTLayout } from '../../../layouts/KOTLayout'
import { useAuth } from '@/lib/auth-context'

const PUBLIC_PATHS = ['/']

export function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()

  // Auth guard: redirect to landing page if not authenticated (skip public paths)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !PUBLIC_PATHS.includes(location.pathname)) {
      navigate({ to: '/', replace: true })
    }
  }, [isLoading, isAuthenticated, location.pathname, navigate])

  // Show loading spinner while auth state is being determined (skip on public paths)
  if (isLoading && !PUBLIC_PATHS.includes(location.pathname)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-gray-700">Loading your session</p>
            <p className="text-xs text-gray-400">Please wait…</p>
          </div>
        </div>
      </div>
    )
  }

  // Landing page — no layout
  if (PUBLIC_PATHS.includes(location.pathname)) {
    return <Outlet />
  }

  // POS page: uses POS layout
  if (location.pathname === '/pos') {
    return (
      <POSLayout>
        <Outlet />
      </POSLayout>
    )
  }

  // KOT Terminal: uses KOT layout
  if (location.pathname === '/kot-terminal') {
    return (
      <KOTLayout>
        <Outlet />
      </KOTLayout>
    )
  }

  // Developer Portal: route owns its layout, skip DashboardLayout
  if (location.pathname.startsWith('/developer')) {
    return <Outlet />
  }

  // All other pages: dashboard layout with sidebar
  return <DashboardLayout />
}
