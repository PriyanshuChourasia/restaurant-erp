import { useState } from 'react'
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
  DollarSign,
  Armchair,
  Table,
  Play,
  ChevronDown,
  BarChart3,
  CreditCard,
  Layers,
  FileText,
  AlertTriangle,
  Clock,
  Warehouse,
  Scale,
  HeartPulse,
  Star,
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
  SidebarMenuSub,
  SidebarMenuSubButton,
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
      { to: '/price-levels', label: 'Price Levels', icon: DollarSign },
    ],
  },
  {
    title: 'Inventory',
    links: [
      { to: '/inventory', label: 'Stock', icon: Package },
      { to: '/storage-units', label: 'Storage Units', icon: Warehouse },
      { to: '/purchases', label: 'Purchases', icon: ClipboardList },
      { to: '/inventory/stock-counts', label: 'Stock Counts', icon: Scale },
      { to: '/inventory/batches', label: 'Batches', icon: Layers },
      { to: '/kitchen-prep', label: 'Kitchen Prep', icon: Play },
    ],
  },
  {
    title: 'Finance',
    links: [
      { to: '/sales', label: 'Sales', icon: Receipt },
      { to: '/ledger', label: 'Ledger', icon: BookOpen },
      { to: '/vouchers', label: 'Vouchers', icon: FileText },
    ],
  },
  {
    title: 'Reports & Analytics',
    links: [
      { to: '/reports', label: 'All Reports', icon: TrendingUp },
    ],
    subLinks: [
      { to: '/reports/sales', label: 'Sales Summary', icon: BarChart3 },
      { to: '/reports/payment-methods', label: 'Payment Methods', icon: CreditCard },
      { to: '/reports/categories', label: 'By Category', icon: Layers },
      { to: '/reports/popular-items', label: 'Popular Items', icon: UtensilsCrossed },
      { to: '/reports/gst', label: 'GST Report', icon: FileText },
      { to: '/reports/trends', label: 'Trend Analysis', icon: TrendingUp },
      { to: '/reports/discount-analysis', label: 'Discount Analysis', icon: DollarSign },
      { to: '/reports/hourly', label: 'Hourly', icon: Clock },
      { to: '/reports/stock', label: 'Stock Status', icon: Package },
      { to: '/reports/low-stock', label: 'Low Stock', icon: AlertTriangle },
      { to: '/reports/profit-loss', label: 'Profit & Loss', icon: TrendingUp },
      { to: '/reports/balance-sheet', label: 'Balance Sheet', icon: BarChart3 },
      { to: '/reports/executive-kpi-dashboard', label: 'KPI Dashboard', icon: LayoutDashboard },
      { to: '/reports/kitchen-queue-status', label: 'Kitchen Queue', icon: CookingPot },
      { to: '/reports/customer-directory', label: 'Customer Directory', icon: Users },
      { to: '/reports/customer-revenue', label: 'Top Customers', icon: DollarSign },
      { to: '/reports/reservation-overview', label: 'Reservations', icon: CalendarDays },
      { to: '/reports/procurement-po-summary', label: 'Purchase Orders', icon: ShoppingCart },
      { to: '/reports/procurement-supplier-performance', label: 'Suppliers', icon: Star },
      { to: '/reports/finance-revenue-vs-expense', label: 'Rev vs Expense', icon: TrendingUp },
      { to: '/reports/inventory-movements', label: 'Stock Movements', icon: ClipboardList },
      { to: '/reports/operations-daily-summary', label: 'Daily Ops', icon: ClipboardList },
      { to: '/reports/executive-health-scorecard', label: 'Health Score', icon: HeartPulse },
    ],
  },
  {
    title: 'Operations',
    links: [
      { to: '/staff', label: 'Staff', icon: Users },
      { to: '/tables', label: 'Tables', icon: Table },
      { to: '/zones', label: 'Zones & Seating', icon: Armchair },
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
  const [reportsOpen, setReportsOpen] = useState(true)

  const isReportsActive = location.pathname.startsWith('/reports')

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
                  const isActive = location.pathname === link.to || (section.title === 'Reports & Analytics' && link.to === '/reports' && isReportsActive)
                  const Icon = link.icon
                  const hasSubLinks = 'subLinks' in section && section.subLinks && section.title === 'Reports & Analytics'

                  if (hasSubLinks && link.to === '/reports') {
                    return (
                      <SidebarMenuItem key={link.to}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={link.label}
                          onClick={() => setReportsOpen(!reportsOpen)}
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Icon size={18} />
                            <span>{link.label}</span>
                          </span>
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 text-sidebar-foreground/50 ${reportsOpen ? 'rotate-180' : ''}`}
                          />
                        </SidebarMenuButton>
                        {reportsOpen && !isCollapsed && (
                          <SidebarMenuSub>
                            {(section as any).subLinks.map((sub: any) => {
                              const SubIcon = sub.icon
                              const isSubActive = location.pathname === sub.to
                              return (
                                <SidebarMenuItem key={sub.to}>
                                  <SidebarMenuSubButton
                                    isActive={isSubActive}
                                    render={<Link to={sub.to} />}
                                  >
                                    <SubIcon size={14} />
                                    <span>{sub.label}</span>
                                  </SidebarMenuSubButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </SidebarMenuSub>
                        )}
                      </SidebarMenuItem>
                    )
                  }

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
