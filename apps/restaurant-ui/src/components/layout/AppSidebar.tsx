import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingCart,
  Package,
  Users,
  CalendarDays,
  Settings,
  UserCircle,
  Monitor,
  Tag,
  CookingPot,
  ClipboardList,
  Receipt,
  BookOpen,
  TrendingUp,
  LogOut,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar'

const navSections = [
  {
    title: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'POS & Orders',
    links: [
      { to: '/pos', label: 'POS Terminal', icon: Monitor },
      { to: '/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/kot', label: 'KOT Board', icon: CookingPot },
    ],
  },
  {
    title: 'Products',
    links: [
      { to: '/items', label: 'Items', icon: Tag },
      { to: '/menu', label: 'Menu', icon: UtensilsCrossed },
      { to: '/categories', label: 'Categories', icon: BookOpen },
    ],
  },
  {
    title: 'Inventory',
    links: [
      { to: '/inventory', label: 'Stock', icon: Package },
      { to: '/purchases', label: 'Purchases', icon: ClipboardList },
    ],
  },
  {
    title: 'Finance',
    links: [
      { to: '/sales', label: 'Sales', icon: Receipt },
      { to: '/ledger', label: 'Ledger', icon: BookOpen },
      { to: '/reports', label: 'Reports', icon: TrendingUp },
    ],
  },
  {
    title: 'Operations',
    links: [
      { to: '/staff', label: 'Staff', icon: Users },
      { to: '/reservations', label: 'Reservations', icon: CalendarDays },
    ],
  },
  {
    title: 'System',
    links: [
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/profile', label: 'Profile', icon: UserCircle },
    ],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSidebar()
  const { user, logout } = useAuth()
  const isCollapsed = state === 'collapsed'

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border/50 p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            C
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">CodyERP</span>
              <span className="text-[11px] text-sidebar-foreground/50">Management System</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {navSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="px-2 text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider">
              {section.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.links.map((link) => {
                  const isActive = location.pathname === link.to
                  const Icon = link.icon
                  return (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={link.label}
                        render={<Link to={link.to} />}
                      >
                        <Icon size={18} />
                        <span>{link.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="POS Terminal" render={<Link to="/pos" />}>
              <Monitor size={18} />
              <span>POS Terminal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 data-active:bg-red-50 data-active:text-red-600"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {!isCollapsed && (
          <div className="mt-4 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {user ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'User'}
              </span>
              <span className="text-xs text-sidebar-foreground/50 capitalize truncate">
                {user?.role || 'Administrator'}
              </span>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
