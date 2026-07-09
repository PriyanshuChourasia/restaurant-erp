import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { apiClient, clearAuth } from './axios-client'
import type { LoginRequest, LoginResponse, AuthUser, ProfileResponse } from '@/modules/auth/types/auth.types'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  fetchProfile: () => Promise<void>
}

function mapProfileToUser(profile: ProfileResponse): AuthUser {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    role: profile.role?.name || '',
    roleName: profile.role?.name,
    permissions: [],
    isActive: profile.isActive,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  }
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: restore session from localStorage immediately (no backend dependency)
  // then refresh profile in the background for up-to-date data
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setIsLoading(false)
      return
    }

    // Restore user from localStorage immediately so the user sees dashboard right away
    const stored = localStorage.getItem('authUser')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        // Corrupted data — clear everything
        clearAuth()
        setUser(null)
        setIsLoading(false)
        return
      }
    }

    // Set default auth header so API calls work
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`

    // Mark as loaded — user is authenticated based on token presence
    setIsLoading(false)

    // Background: try to fetch fresh profile (non-blocking, don't interrupt UX)
    apiClient.get<ProfileResponse>('/auth/profile').then(({ data }) => {
      const mapped = mapProfileToUser(data)
      const stored = localStorage.getItem('authUser')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser
          mapped.permissions = parsed.permissions || []
        } catch {
          // ignore
        }
      }
      localStorage.setItem('authUser', JSON.stringify(mapped))
      setUser(mapped)
    }).catch(() => {
      // Profile refresh failed — user stays logged in from localStorage data
      // Token may be expired but user keeps seeing dashboard until next API call
    })
  }, [])

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      clearAuth()
      setUser(null)
      return
    }

    try {
      const { data } = await apiClient.get<ProfileResponse>('/auth/profile')
      const mapped = mapProfileToUser(data)

      const stored = localStorage.getItem('authUser')
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as AuthUser
          mapped.permissions = parsed.permissions || []
        } catch {
          // ignore
        }
      }

      localStorage.setItem('authUser', JSON.stringify(mapped))
      setUser(mapped)
    } catch {
      // Best-effort — user stays logged in from localStorage
    }
  }, [])

  const login = useCallback(async (payload: LoginRequest) => {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload)
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('authUser', JSON.stringify(data.user))
    setUser(data.user)

    // Fetch fresh profile right after login for the most up-to-date data
    try {
      const { data: profile } = await apiClient.get<ProfileResponse>('/auth/profile')
      const mapped = mapProfileToUser(profile)
      mapped.permissions = data.user.permissions || []
      localStorage.setItem('authUser', JSON.stringify(mapped))
      setUser(mapped)
    } catch {
      // Profile fetch is best-effort; login response data is already set
    }
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken })
      }
    } catch {
      // Ignore errors on logout
    }
    clearAuth()
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      clearAuth()
      setUser(null)
      return
    }
    try {
      const { data } = await apiClient.post('/auth/refresh', { refreshToken })
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('authUser', JSON.stringify(data.user))
      setUser(data.user)
    } catch {
      clearAuth()
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refresh,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
