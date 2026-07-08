import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { UtensilsCrossed, Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import '../../../styles/global.css'

const DEMO_EMAIL = 'admin@restaurant.com'
const DEMO_PASSWORD = 'Admin@123456'

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const auth = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await auth.login({ email, password })
      await navigate({ to: '/' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Invalid email or password'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left decorative panel */}
      <div className="login-panel">
        <div className="login-panel-content">
          <div className="login-brand-icon">
            <UtensilsCrossed size={32} />
          </div>
          <h1 className="login-panel-title">RestaurantERP</h1>
          <p className="login-panel-subtitle">
            Complete restaurant management solution. Manage orders, inventory, staff, and more from one place.
          </p>
          <div className="login-panel-features">
            <div className="login-panel-feature">
              <span className="login-panel-feature-dot" />
              <span>Real-time order management</span>
            </div>
            <div className="login-panel-feature">
              <span className="login-panel-feature-dot" />
              <span>Inventory & supply tracking</span>
            </div>
            <div className="login-panel-feature">
              <span className="login-panel-feature-dot" />
              <span>Staff scheduling & management</span>
            </div>
            <div className="login-panel-feature">
              <span className="login-panel-feature-dot" />
              <span>Detailed analytics & reports</span>
            </div>
          </div>
        </div>
        <p className="login-panel-copyright">
          &copy; 2026 RestaurantERP. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-form-title">Welcome back</h2>
            <p className="login-form-subtitle">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label className="login-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="login-input"
                placeholder="name@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Password</label>
              <div className="login-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-options">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  className="login-checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="login-checkbox-text">Remember me</span>
              </label>
              <button type="button" className="login-forgot-link">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className={`login-submit${isLoading ? ' login-submit-loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="login-spinner" />
              ) : (
                <LogIn size={18} />
              )}
              <span>{isLoading ? 'Signing in...' : 'Sign in'}</span>
            </button>
          </form>

          <div className="login-divider">
            <span className="login-divider-line" />
            <span className="login-divider-text">Demo Credentials</span>
            <span className="login-divider-line" />
          </div>

          <div className="login-demo-box">
            <div className="login-demo-row">
              <span className="login-demo-label">Email:</span>
              <code className="login-demo-value">admin@restaurant.com</code>
            </div>
            <div className="login-demo-row">
              <span className="login-demo-label">Password:</span>
              <code className="login-demo-value">Admin@123456</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
