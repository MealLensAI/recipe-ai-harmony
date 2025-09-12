import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { api } from "./api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
  clearSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token storage keys
const TOKEN_KEY = "access_token"
const USER_KEY = "user_data"

// Safe storage helpers (handle private mode / blocked storage)
const memoryStore = new Map<string, string>()

export function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      const val = window.localStorage.getItem(key)
      if (val !== null) return val
      // If localStorage is accessible but empty for this key, fall back to memory
      return memoryStore.has(key) ? memoryStore.get(key)! : null
    }
  } catch {
    // localStorage not available or blocked
  }
  return memoryStore.has(key) ? memoryStore.get(key)! : null
}

export function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.setItem(key, value)
      // Verify it was actually stored
      if (window.localStorage.getItem(key) === value) {
        return
      }
    }
  } catch {
    // fall through to memory
  }
  memoryStore.set(key, value)
}

export function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && 'localStorage' in window) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // ignore
  }
  memoryStore.delete(key)
}

// Pure TypeScript AuthProvider (no JSX)
export function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const initRef = useRef(false)

  // Smooth page transition overlay to avoid route flash
  const showFadeTransition = useCallback(() => {
    try {
      const existing = document.getElementById('page-transition-overlay')
      if (existing) return
      const overlay = document.createElement('div')
      overlay.id = 'page-transition-overlay'
      overlay.style.position = 'fixed'
      overlay.style.inset = '0'
      overlay.style.background = 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)'
      overlay.style.opacity = '0'
      overlay.style.transition = 'opacity 150ms ease'
      overlay.style.zIndex = '9999'
      overlay.style.display = 'flex'
      overlay.style.alignItems = 'center'
      overlay.style.justifyContent = 'center'

      // Center content container
      const container = document.createElement('div')
      container.style.display = 'flex'
      container.style.flexDirection = 'column'
      container.style.alignItems = 'center'
      container.style.gap = '12px'

      // Spinner element
      const spinner = document.createElement('div')
      spinner.style.width = '44px'
      spinner.style.height = '44px'
      spinner.style.border = '4px solid rgba(0,0,0,0.08)'
      spinner.style.borderTop = '4px solid #f97316' // orange-500
      spinner.style.borderRadius = '50%'
      // Use Web Animations API for rotation
      try {
        spinner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 800, iterations: Infinity })
      } catch { }

      // Label
      const label = document.createElement('div')
      label.textContent = 'Loading...'
      label.style.fontSize = '14px'
      label.style.color = '#4b5563' // gray-600
      label.style.fontWeight = '600'

      container.appendChild(spinner)
      container.appendChild(label)
      overlay.appendChild(container)
      document.body.appendChild(overlay)

      // Ensure transition applies
      requestAnimationFrame(() => {
        overlay.style.opacity = '1'
      })
    } catch (err) {
      // no-op if DOM not available
    }
  }, [])

  // Clear session data
  const clearSession = useCallback(() => {
    safeRemoveItem(TOKEN_KEY)
    safeRemoveItem(USER_KEY)
    safeRemoveItem('supabase_refresh_token')
    safeRemoveItem('supabase_session_id')
    safeRemoveItem('supabase_user_id')
    // Also clear subscription/trial caches to avoid stale gating after logout
    safeRemoveItem('meallensai_user_access_status')
    safeRemoveItem('meallensai_trial_start')
    safeRemoveItem('meallensai_subscription_status')
    safeRemoveItem('meallensai_subscription_expires_at')
    setUser(null)
    setToken(null)
  }, [])

  // Sign out function - Supabase doesn't need explicit sign out call
  const signOut = useCallback(async () => {
    try {
      // Show fade overlay first to prevent flashes while redirecting
      showFadeTransition()
      // Ask backend to clear httpOnly cookie if present
      try {
        const { APP_CONFIG } = await import('./config')
        await fetch(`${APP_CONFIG.api.base_url}/api/logout`, { method: 'POST', credentials: 'include' })
      } catch { }
      // Clear all session data
      clearSession()
      // Use window.location.replace to avoid flash
      setTimeout(() => window.location.replace('/landing'), 200)
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, clear session and redirect
      try { showFadeTransition() } catch { }
      clearSession()
      setTimeout(() => window.location.replace('/landing'), 200)
    }
  }, [clearSession, showFadeTransition])

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    console.log('🔄 refreshAuth called')
    setLoading(true)
    try {
      // Check if we have a stored token (from backend login)
      const storedToken = safeGetItem(TOKEN_KEY)
      const storedUserData = safeGetItem(USER_KEY)

      console.log('🔍 Auth state check:', {
        hasToken: !!storedToken,
        hasUserData: !!storedUserData,
        tokenLength: storedToken?.length || 0
      })

      if (storedToken && storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData)
          setToken(storedToken)
          setUser(parsedUser as User)
          console.log('✅ Auth state set from localStorage:', { uid: parsedUser.uid, email: parsedUser.email })

          // Ensure we always have a non-null user object to reference later
          let effectiveUser: User = parsedUser as User

          // Skip backend profile fetch to prevent loops - use stored data only

          setLoading(false)
          console.log('✅ refreshAuth completed successfully')

          // Trigger trial status refresh after successful login
          // This will show loading spinner while determining subscription status
          try {
            await import('./trialService')
            // Clear any cached trial status to force fresh check
            safeRemoveItem('meallensai_user_access_status')
            // Also clear trial and subscription data to force re-initialization
            const userId = effectiveUser.uid || 'anon'
            safeRemoveItem(`meallensai_trial_start:${userId}`)
            safeRemoveItem(`meallensai_subscription_status:${userId}`)
            safeRemoveItem(`meallensai_subscription_expires_at:${userId}`)
            console.log('🔄 Cleared trial/subscription cache after login')
          } catch (error) {
            console.error('Error refreshing trial status after login:', error)
          }

          return
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          // Clear invalid data
          clearSession()
        }
      }

      // Skip cookie-based session check to prevent infinite loops
      console.log('❌ No valid token found locally')

      // Not authenticated at all
      clearSession()
      setLoading(false)
    } catch (error) {
      console.error('Error in refreshAuth:', error)
      clearSession()
      setLoading(false)
    }
  }, [clearSession])

  // Initialize auth state
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    refreshAuth()
  }, [refreshAuth])

  // Listen for storage changes (e.g., login in another tab)
  useEffect(() => {
    // Disable storage listener to prevent infinite loops
    // const handleStorage = () => {
    //   const storedToken = localStorage.getItem(TOKEN_KEY)
    //   const storedUserData = localStorage.getItem(USER_KEY)
    //   if (storedToken && storedUserData) {
    //     try {
    //       const parsedUser = JSON.parse(storedUserData)
    //       setToken(storedToken)
    //       setUser(parsedUser as User)
    //     } catch (error) {
    //       console.error('Error parsing user data from storage:', error)
    //       clearSession()
    //     }
    //   } else {
    //     clearSession()
    //   }
    // }
    // window.addEventListener("storage", handleStorage)
    // return () => {
    //   window.removeEventListener("storage", handleStorage)
    // }
  }, [clearSession])

  const isAuthenticated = !!token && !!user

  return {
    user,
    token,
    loading,
    isAuthenticated,
    refreshAuth,
    signOut,
    clearSession
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Export AuthContext for use in a .tsx provider wrapper
export { AuthContext }
