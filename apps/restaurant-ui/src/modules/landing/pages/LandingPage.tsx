import { useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import {
  UtensilsCrossed,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Clock,
  Monitor,
  CookingPot,
  ClipboardList,
  Receipt,
  TrendingUp,
  CalendarDays,
  BookOpen,
  Tag,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Bot,
  Sparkles,
  MessageSquare,
  Zap,
  Wifi,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { register } from '@/modules/auth/api/auth.api'
import { useAuth } from '@/lib/auth-context'

// ─── Types ────────────────────────────────────────────────────────────

type FormMode = 'login' | 'register'

// ─── Features Data ────────────────────────────────────────────────────

const features = [
  {
    icon: Monitor,
    title: 'POS Terminal',
    description: 'Touch-friendly point of sale with instant billing, KOT generation, and multiple payment modes.',
    bg: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    icon: ShoppingCart,
    title: 'Order Management',
    description: 'Track orders from creation to delivery. Real-time status updates for kitchen, staff, and management.',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    icon: CookingPot,
    title: 'KOT Board',
    description: 'Digital kitchen order tickets with station-wise sorting, real-time updates, and preparation tracking.',
    bg: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    description: 'Track stock levels, set low-stock alerts, manage suppliers, and automate purchase orders.',
    bg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    icon: Tag,
    title: 'Menu & Items',
    description: 'Create and manage menu items with categories, pricing, GST, variants, and dietary labels.',
    bg: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    icon: Users,
    title: 'Staff Management',
    description: 'Manage roles, permissions, schedules, and performance tracking for all restaurant staff.',
    bg: 'bg-cyan-50',
    textColor: 'text-cyan-600',
  },
  {
    icon: Receipt,
    title: 'Sales & Billing',
    description: 'Generate GST-compliant invoices, track daily sales, and manage payment collections.',
    bg: 'bg-pink-50',
    textColor: 'text-pink-600',
  },
  {
    icon: BookOpen,
    title: 'Ledger & Accounting',
    description: 'Maintain general ledger, track accounts, manage opening balances, and view balance sheets.',
    bg: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    icon: TrendingUp,
    title: 'Reports & Analytics',
    description: 'Get insights with sales reports, GST summaries, popular items, and performance dashboards.',
    bg: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    icon: ClipboardList,
    title: 'Purchase Management',
    description: 'Track purchase orders, manage supplier relationships, and monitor procurement costs.',
    bg: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    icon: CalendarDays,
    title: 'Reservations',
    description: 'Accept and manage table reservations, seating arrangements, and guest preferences.',
    bg: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Insights',
    description: 'Real-time dashboard with KPI cards, revenue trends, popular items, and recent orders at a glance.',
    bg: 'bg-sky-50',
    textColor: 'text-sky-600',
  },
]

const benefits = [
  {
    icon: Clock,
    title: 'Save 40% Time',
    description: 'Automate order processing, billing, and inventory tracking to reduce manual effort.',
  },
  {
    icon: TrendingUp,
    title: 'Increase Revenue',
    description: 'Data-driven insights help optimize menu pricing, reduce waste, and boost profitability.',
  },
  {
    icon: CheckCircle2,
    title: 'Reduce Errors',
    description: 'Digital KOTs eliminate miscommunication between waitstaff and kitchen.',
  },
  {
    icon: Users,
    title: 'Team Productivity',
    description: 'Role-based access and performance tracking keep your team aligned and efficient.',
  },
]

// ─── Form Input ──────────────────────────────────────────────────────

function FormInput({
  label,
  id,
  type,
  placeholder,
  value,
  onChange,
  error,
  icon: Icon,
}: {
  label: string
  id: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: string
  icon?: typeof UtensilsCrossed
}) {
  return (
    <div className="group">
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-primary"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary">
            <Icon size={16} />
          </div>
        )}
        <Input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-10 rounded-xl border bg-white/80 px-4 text-sm shadow-none transition-all placeholder:text-gray-400 focus:bg-white',
            Icon && 'pl-10',
            error ? 'border-red-300 bg-red-50' : 'border-gray-200'
          )}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Mode Toggle ──────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: FormMode; onChange: (m: FormMode) => void }) {
  return (
    <div className="relative flex rounded-xl bg-gray-100 p-1">
      <button
        onClick={() => onChange('login')}
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all',
          mode === 'login'
            ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md'
            : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
        )}
      >
        <LogIn size={16} />
        Sign In
      </button>
      <button
        onClick={() => onChange('register')}
        className={cn(
          'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
          mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        <UserPlus size={16} />
        Create Account
      </button>
    </div>
  )
}

// ─── Gradient Button helper ───────────────────────────────────────────

function GradientButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────

export function LandingPage() {
  const navigate = useNavigate()
  const auth = useAuth()

  // Form mode
  const [mode, setMode] = useState<FormMode>('register')

  // Shared state — pre-filled with demo admin credentials
  const [email, setEmail] = useState('admin@restaurant.com')
  const [password, setPassword] = useState('Admin@123456')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Register-only state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Validation errors
  const [validation, setValidation] = useState<{
    name?: string
    email?: string
    password?: string
    phone?: string
  }>({})

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setName('')
    setPhone('')
    setShowPassword(false)
    setIsLoading(false)
    setError(null)
    setSuccess(false)
    setValidation({})
  }

  const switchMode = (newMode: FormMode) => {
    setMode(newMode)
    if (newMode === 'login') {
      // Pre-fill demo admin credentials when switching to Sign In
      setEmail('admin@restaurant.com')
      setPassword('Admin@123456')
      setShowPassword(false)
      setName('')
      setPhone('')
    } else {
      resetForm()
    }
    setIsLoading(false)
    setError(null)
    setSuccess(false)
    setValidation({})
  }

  const validateLogin = (): boolean => {
    const errs: typeof validation = {}
    if (!email.trim()) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    setValidation(errs)
    return Object.keys(errs).length === 0
  }

  const validateRegister = (): boolean => {
    const errs: typeof validation = {}
    if (!name.trim()) errs.name = 'Name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (phone && !/^[+]?[\d\s()-]{7,20}$/.test(phone)) errs.phone = 'Invalid phone number'
    setValidation(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (mode === 'login') {
      if (!validateLogin()) return
      setIsLoading(true)
      setError(null)
      try {
        await auth.login({ email: email.trim(), password })
        await navigate({ to: '/dashboard' })
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Invalid email or password'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    } else {
      if (!validateRegister()) return
      setIsLoading(true)
      setError(null)
      try {
        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        })
        setSuccess(true)
        setTimeout(() => {
          switchMode('login')
        }, 2000)
      } catch (err: any) {
        const message = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  // ─── Success State ──────────────────────────────────────────────

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={40} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="mt-2 text-gray-500">Your account has been created. Sign in below to get started.</p>
          </div>
          <GradientButton onClick={() => switchMode('login')}>
            <LogIn size={16} />
            Sign In Now
          </GradientButton>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero / Navigation ──────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-md">
              <UtensilsCrossed size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">CodyERP</span>
          </Link>
          <GradientButton onClick={() => switchMode('register')} size="sm">
            <UserPlus size={15} />
            Get Started
          </GradientButton>
        </div>
      </header>

      {/* ─── Hero Section ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-bg/30">
        {/* Animated background decorations */}
        <div className="pointer-events-none absolute -right-40 -top-40 size-[600px] rounded-full bg-gradient-to-br from-primary/5 to-primary-bg/20 blur-3xl animate-hero-float-slow" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 size-[500px] rounded-full bg-gradient-to-tr from-blue-100/50 to-indigo-100/30 blur-3xl animate-hero-float-slow" style={{ animationDelay: '-7s' }} />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Hero Text */}
            <div className="max-w-xl">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl animate-hero-slide-up" style={{ animationDelay: '0.1s' }}>
                Complete{' '}
                <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent bg-[length:200%_100%] animate-hero-shimmer">
                  Restaurant Management
                </span>{' '}
                Solution
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-500 animate-hero-slide-up" style={{ animationDelay: '0.2s' }}>
                From POS billing to inventory tracking, staff management to financial reports — 
                CodyERP is the all-in-one platform that streamlines every aspect of your 
                restaurant operations.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 animate-hero-slide-up" style={{ animationDelay: '0.3s' }}>
                <GradientButton onClick={() => switchMode('register')} className="px-6 py-3 text-sm font-semibold h-auto">
                  <UserPlus size={18} />
                  Get Started Free
                </GradientButton>
                <Button
                  variant="outline"
                  className="h-auto px-6 py-3 text-sm font-semibold shadow-sm"
                  render={<a href="#features" />}
                >
                  Explore Features
                  <ArrowRight size={16} />
                </Button>
              </div>

              {/* Stats bar */}
              <div className="mt-10 grid grid-cols-3 gap-4 border-t border-gray-100 pt-8 animate-hero-slide-up" style={{ animationDelay: '0.4s' }}>
                {[
                  { value: '12+', label: 'Integrated Modules' },
                  { value: '₹0', label: 'Setup Cost' },
                  { value: '99.9%', label: 'Uptime' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Auth Form — Login / Register Toggle */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl sm:p-8 lg:p-10 animate-hero-slide-right" style={{ animationDelay: '0.15s' }}>
              <div className="mb-6">
                <ModeToggle mode={mode} onChange={switchMode} />
              </div>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-md">
                  {mode === 'login' ? <LogIn size={22} /> : <UserPlus size={22} />}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {mode === 'login'
                    ? 'Sign in to access your restaurant dashboard.'
                    : 'Start your 30-day free trial. No credit card required.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                {mode === 'register' && (
                  <FormInput
                    label="Full Name"
                    id="name"
                    type="text"
                    placeholder="Rajesh Kumar"
                    value={name}
                    onChange={setName}
                    error={validation.name}
                    icon={Users}
                  />
                )}

                <FormInput
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="rajesh@restaurant.com"
                  value={email}
                  onChange={setEmail}
                  error={validation.email}
                  icon={UtensilsCrossed}
                />

                {mode === 'register' && (
                  <FormInput
                    label="Phone (Optional)"
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={setPhone}
                    error={validation.phone}
                  />
                )}

                <div className="group">
                  <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-gray-700 transition-colors group-focus-within:text-primary">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={mode === 'register' ? 'Min. 8 characters' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        'h-10 w-full rounded-xl border bg-white/80 px-4 pr-10 text-sm shadow-none transition-all placeholder:text-gray-400 focus:bg-white',
                        validation.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  {validation.password && <p className="mt-1 text-xs text-red-500">{validation.password}</p>}
                </div>

                <GradientButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-auto px-6 py-3 text-sm font-semibold"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                      {mode === 'login' ? 'Sign In' : 'Create Free Account'}
                    </span>
                  )}
                </GradientButton>

                {mode === 'register' && (
                  <p className="text-center text-xs text-gray-400">
                    By signing up, you agree to our{' '}
                    <span className="text-primary hover:underline cursor-pointer">Terms of Service</span> and{' '}
                    <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
                  </p>
                )}
              </form>

              {mode === 'login' && (
                <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Demo Credentials</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 min-w-[40px]">Email:</span>
                      <code className="rounded bg-gray-200 px-2 py-0.5 font-mono text-gray-700 text-[11px]">
                        admin@restaurant.com
                      </code>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 min-w-[40px]">Pass:</span>
                      <code className="rounded bg-gray-200 px-2 py-0.5 font-mono text-gray-700 text-[11px]">
                        Admin@123456
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Benefits Strip ─────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-bg text-primary">
                  <benefit.icon size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{benefit.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Sahayak AI Assistant Section ────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-950 py-16 lg:py-24">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -left-40 -top-40 size-[500px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 size-[400px] rounded-full bg-primary/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left — Bot visual & name */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-6 flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/25 ring-4 ring-white/10">
                <Bot size={48} />
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Meet{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Sahayak
                </span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-400">
                Your restaurant's intelligent AI assistant. Sahayak automates orders, monitors inventory, 
                tracks staff performance, and keeps your operations running smoothly — so you can focus 
                on what matters: your guests.
              </p>

              {/* Capability stats */}
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  { value: '24/7', label: 'Monitoring' },
                  { value: '99%', label: 'Accuracy' },
                  { value: '0', label: 'Manual Effort' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Feature list */}
              <div className="mt-8 flex flex-col gap-4">
                {[
                  { icon: MessageSquare, text: 'Automatically processes KOTs and routes orders to the kitchen' },
                  { icon: Zap, text: 'Detects low-stock items and auto-generates purchase requests' },
                  { icon: Wifi, text: 'Monitors real-time sales, table occupancy, and staff activity' },
                  { icon: Sparkles, text: 'Learns your restaurant patterns to suggest smarter decisions' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                      <item.icon size={16} />
                    </div>
                    <span className="text-sm text-gray-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Bot chat preview */}
            <div className="relative">
              {/* Chat window mockup */}
              <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/50 backdrop-blur-sm shadow-2xl">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-gray-700/50 px-5 py-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Bot size={18} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">Sahayak</span>
                      <span className="flex size-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] text-emerald-400 font-medium">Active</span>
                    </div>
                    <span className="text-[11px] text-gray-500">AI Restaurant Assistant</span>
                  </div>
                </div>

                {/* Chat messages */}
                <div className="flex flex-col gap-4 p-5">
                  {/* Bot message */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                      S
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-gray-700/60 px-4 py-2.5 text-sm text-gray-200 max-w-[85%]">
                      Good evening! Table 4 has been waiting 8 minutes. Shall I send a status update to the kitchen? 🍽️
                    </div>
                  </div>

                  {/* User message */}
                  <div className="flex items-start gap-3 justify-end">
                    <div className="rounded-xl rounded-tr-sm bg-indigo-600/30 px-4 py-2.5 text-sm text-gray-200 max-w-[75%]">
                      Yes, please expedite Table 4 — they ordered the butter chicken special.
                    </div>
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                      R
                    </div>
                  </div>

                  {/* Bot response */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                      S
                    </div>
                    <div className="rounded-xl rounded-tl-sm bg-gray-700/60 px-4 py-2.5 text-sm text-gray-200 max-w-[85%]">
                      Done! KOT sent to the kitchen with priority flag. Also, I noticed we're running low on butter chicken masala — I've added it to tomorrow's purchase list. 🚀
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">
                      S
                    </div>
                    <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm bg-gray-700/60 px-4 py-3">
                      <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                      <span className="size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>

                {/* Chat input */}
                <div className="border-t border-gray-700/50 px-5 py-3">
                  <div className="flex items-center gap-2 rounded-xl border border-gray-600/50 bg-gray-700/30 px-4 py-2.5">
                    <input
                      type="text"
                      placeholder="Ask Sahayak anything..."
                      className="flex-1 bg-transparent text-sm text-gray-200 outline-none placeholder:text-gray-500"
                      readOnly
                    />
                    <button className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white" disabled>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-1 text-[10px] font-semibold text-white shadow-lg">
                <Sparkles size={12} />
                AI Powered
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Grid ──────────────────────────────────────── */}
      <section id="features" className="bg-gray-50/50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything to run your restaurant
            </h2>
            <p className="mt-4 text-base text-gray-500">
              12 integrated modules that work together seamlessly to manage every aspect of your restaurant operations.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-gray-100 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-gray-200"
              >
                <div className={cn('mb-4 flex size-12 items-center justify-center rounded-xl transition-all group-hover:scale-110', feature.bg, feature.textColor)}>
                  <feature.icon size={22} />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform your restaurant?
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Join thousands of restaurants using CodyERP to streamline operations, 
            reduce costs, and grow revenue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <GradientButton onClick={() => switchMode('register')} className="px-6 py-3 text-sm font-semibold h-auto">
              <UserPlus size={18} />
              Start Free Trial
            </GradientButton>
            <Button
              variant="outline"
              className="h-auto px-6 py-3 text-sm font-semibold border-gray-600 text-white bg-white/5 hover:bg-white/10 hover:text-white"
              onClick={() => switchMode('login')}
            >
              <LogIn size={18} />
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5 text-sm text-gray-400">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light text-white shadow-sm">
              <UtensilsCrossed size={14} />
            </div>
            CodyERP — &copy; {new Date().getFullYear()} All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Terms</span>
            <span>Privacy</span>
            <span>Contact</span>
            <span>Docs</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
