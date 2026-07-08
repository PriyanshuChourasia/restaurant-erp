import { ReactNode } from 'react'
import { Outlet } from '@tanstack/react-router'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'

interface DashboardLayoutProps {
  children?: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <SidebarTrigger className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
        </DashboardHeader>
        <main className="flex-1 overflow-auto p-6">
          {children || <Outlet />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
