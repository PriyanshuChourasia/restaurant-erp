import { Outlet, useLocation } from '@tanstack/react-router'
import { DashboardLayout } from '../../../layouts/DashboardLayout'
import { POSLayout } from '../../../layouts/POSLayout'

export function AppLayout() {
  const location = useLocation()

  // Login page: no layout
  if (location.pathname === '/login') {
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

  // All other pages: dashboard layout with sidebar
  return <DashboardLayout />
}
