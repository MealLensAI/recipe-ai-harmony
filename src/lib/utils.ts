import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
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

// Pure TypeScript AuthProvider (no JSX)
export function useProvideAuth(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Clear session data
  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('supabase_refresh_token')
    localStorage.removeItem('supabase_session_id')
    localStorage.removeItem('supabase_user_id')
    setUser(null)
    setToken(null)
  }, [])

  // Sign out function - Supabase doesn't need explicit sign out call
  const signOut = useCallback(async () => {
    try {
      // Clear all session data
      clearSession()
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if there's an error, clear session and redirect
      clearSession()
      window.location.href = '/login'
    }
  }, [clearSession])

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    setLoading(true)
    try {
      // Check if we have a stored token (from backend login)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUserData = localStorage.getItem(USER_KEY)

      if (storedToken && storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData)
          setToken(storedToken)
          setUser(parsedUser as User)

          // Fetch fresh profile data from backend
          try {
            // For now, skip profile fetch since getUserProfile doesn't exist
            // Continue with stored user data
          } catch (profileError) {
            console.error('Error fetching user profile:', profileError)
            // Continue with stored user data if profile fetch fails
          }

          setLoading(false)
          return
        } catch (error) {
          console.error('Error parsing stored user data:', error)
          // Clear invalid data
          clearSession()
        }
      }

      // No valid token found, user is not authenticated
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
    refreshAuth()
  }, [refreshAuth])

  // Listen for storage changes (e.g., login in another tab)
  useEffect(() => {
    const handleStorage = () => {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUserData = localStorage.getItem(USER_KEY)

      if (storedToken && storedUserData) {
        try {
          const parsedUser = JSON.parse(storedUserData)
          setToken(storedToken)
          setUser(parsedUser as User)
        } catch (error) {
          console.error('Error parsing user data from storage:', error)
          clearSession()
        }
      } else {
        clearSession()
      }
    }

    window.addEventListener("storage", handleStorage)
    return () => {
      window.removeEventListener("storage", handleStorage)
    }
  }, [clearSession])

  const isAuthenticated = !!token && !!user

  // Debug logging
  console.log('Auth state:', { token: !!token, user: !!user, isAuthenticated, loading })

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
