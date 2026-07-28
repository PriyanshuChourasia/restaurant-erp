import { useState } from 'react'
import {
  Code2, Home, ChevronDown, ChevronRight,
  Users, Shield, Tag, Package, Truck,
  FileText, BarChart3, Settings, ShoppingCart, BookOpen,
  LogOut, Table2, Layers, Receipt, CalendarDays,
  Warehouse, Play, DollarSign,
  Armchair, Monitor, CookingPot, ClipboardList, PlayCircle, TrendingUp,
  Database,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth-context'
import { useDevTables } from '@/modules/developer/hooks/useDeveloper'
import type { DevTable } from '@/modules/developer/api/developer.api'

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
} from '@/components/ui/sidebar'

const iconMap: Record<string, any> = {
  users: Users,
  roles: Shield,
  permissions: Shield,
  items: Tag,
  categories: Layers,
  customers: Users,
  suppliers: Truck,
  orders: ShoppingCart,
  invoices: Receipt,
  kots: CookingPot,
  inventory: Package,
  recipes: BookOpen,
  price_levels: DollarSign,
  ledger_accounts: BarChart3,
  vouchers: FileText,
  reservations: CalendarDays,
  zones: Armchair,
  tables: Table2,
}

const moduleLinks = [
  { to: '/items', label: 'Items', icon: Tag },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/sales', label: 'Sales', icon: Receipt },
  { to: '/purchases', label: 'Purchases', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/staff', label: 'Staff', icon: Users },
  { to: '/categories', label: 'Categories', icon: Layers },
  { to: '/price-levels', label: 'Price Levels', icon: DollarSign },
  { to: '/storage-units', label: 'Storage Units', icon: Warehouse },
  { to: '/kitchen-prep', label: 'Kitchen Prep', icon: Play },
  { to: '/kot', label: 'KOT Board', icon: CookingPot },
  { to: '/kot-terminal', label: 'KOT Terminal', icon: PlayCircle },
  { to: '/pos', label: 'POS Terminal', icon: Monitor },
  { to: '/reservations', label: 'Reservations', icon: CalendarDays },
  { to: '/zones', label: 'Zones & Seating', icon: Armchair },
  { to: '/tables', label: 'Tables', icon: Table2 },
  { to: '/ledger', label: 'Ledger', icon: BarChart3 },
  { to: '/vouchers', label: 'Vouchers', icon: FileText },
]

export function DeveloperSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { data: dbTables } = useDevTables()

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    Overview: true,
    Developer: true,
    Database: true,
    Modules: false,
  })

  const toggleSection = (title: string) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  const tableLinks = (dbTables || []).map((t: DevTable) => ({
    to: `/developer/tables/${t.tableName}`,
    label: t.tableName,
    icon: iconMap[t.tableName] || Database,
  }))

  const navSections: Array<{
    title: string
    links: Array<{ to: string; label: string; icon: any }>
  }> = [
    {
      title: 'Overview',
      links: [
        { to: '/developer', label: 'Dashboard', icon: Home },
      ],
    },
    {
      title: 'Developer',
      links: [
        { to: '/developer/users', label: 'Users', icon: Users },
        { to: '/developer/schema', label: 'Module Schema', icon: Layers },
        { to: '/developer/user-schema', label: 'User & RBAC Schema', icon: Shield },
        { to: '/developer/voucher-schema', label: 'Voucher Schema', icon: FileText },
        { to: '/developer/price-level-schema', label: 'Price Level Schema', icon: DollarSign },
        { to: '/developer/supplier-schema', label: 'Supplier Schema', icon: Truck },
        { to: '/developer/customer-schema', label: 'Customer Schema', icon: Users },
        { to: '/developer/seating-schema', label: 'Zone & Seating Schema', icon: Armchair },
        { to: '/developer/order-schema', label: 'Order Schema', icon: ShoppingCart },
        { to: '/developer/recipe-schema', label: 'Recipe Schema', icon: BookOpen },
        { to: '/developer/ledger-schema', label: 'Ledger Schema', icon: BarChart3 },
        { to: '/developer/account-nature-schema', label: 'Account Nature Schema', icon: Database },
        { to: '/developer/account-group-schema', label: 'Account Group Schema', icon: Database },
      ],
    },
    {
      title: 'Database',
      links: tableLinks,
    },
    {
      title: 'Modules',
      links: moduleLinks,
    },
  ]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/developer" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Code2 size={16} />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Developer</span>
                <span className="truncate text-xs text-muted-foreground">Portal</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>
              <button
                onClick={() => toggleSection(section.title)}
                className="flex w-full items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
              >
                {expandedSections[section.title] ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                {section.title}
                {section.title === 'Database' && dbTables && (
                  <span className="ml-1 text-[9px] font-normal text-muted-foreground">({dbTables.length})</span>
                )}
              </button>
            </SidebarGroupLabel>
            {expandedSections[section.title] && (
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.links.map((link) => {
                    const isActive = location.pathname === link.to
                    return (
                      <SidebarMenuItem key={link.to + link.label}>
                        <SidebarMenuButton
                          isActive={isActive}
                          render={<Link to={link.to} />}
                          className={isActive ? 'bg-violet-50 text-violet-700 hover:bg-violet-100 hover:text-violet-800' : ''}
                        >
                          <link.icon size={14} className={isActive ? 'text-violet-500' : 'text-muted-foreground'} />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/dashboard" />}>
              <Home size={14} />
              <span>Exit to Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <LogOut size={14} />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
