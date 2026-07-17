import { ReactNode } from 'react'
import { Outlet } from '@tanstack/react-router'
import { Code2 } from 'lucide-react'
import { DeveloperSidebar } from '@/components/layout/DeveloperSidebar'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'

interface DeveloperLayoutProps {
  children?: ReactNode
}

export function DeveloperLayout({ children }: DeveloperLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <DeveloperSidebar />
      <SidebarInset>
        <header className="flex h-11 sm:h-14 items-center gap-2 sm:gap-3 border-b border-border bg-card px-3 sm:px-4 shrink-0">
          <SidebarTrigger className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Code2 size={16} className="text-violet-500 sm:hidden" />
            <Code2 size={20} className="text-violet-500 hidden sm:block" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">Developer Portal</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">System Administration</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children || <Outlet />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
