import { useAuth, safeGetItem, safeRemoveItem } from './utils'
import { APP_CONFIG } from '@/lib/config'

// API base URL
// In production, always target the backend base URL from config (Render)
// In development, you may still use the Vite proxy by overriding VITE_API_URL, otherwise this will still work hitting Render directly
const API_BASE_URL = `${APP_CONFIG.api.base_url}/api`

// Custom error class for API errors
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Response wrapper type
export interface APIResponse<T = any> {
  status: 'success' | 'error'
  message?: string
  data?: T
}

// Auth response shapes from backend
export interface LoginResponse {
  status: 'success' | 'error'
  message?: string
  user_id?: string
  auth_type?: string
  session_id?: string
  session_created_at?: string
  access_token?: string
  refresh_token?: string
  user_data?: { id: string; email: string; metadata?: any }
}

export interface RegisterResponse {
  status: 'success' | 'error'
  message?: string
  user_id?: string
  email?: string
}

// Request options type
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  skipAuth?: boolean
  timeout?: number
  suppressAuthRedirect?: boolean
}

// Centralized API service
class APIService {
  private getAuthToken(): string | null {
    return safeGetItem('access_token')
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      skipAuth = false,
      timeout = 10000,
      suppressAuthRedirect = false
    } = options

    // Add auth header if token is present; otherwise rely on cookie-based auth
    if (!skipAuth) {
      const token = this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    // Add default headers
    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    // Prepare request config with cross-browser timeout support
    // AbortSignal.timeout is not supported in some browsers (older Safari/Firefox),
    // so we use AbortController and manually abort after the timeout duration.
    const controller = new AbortController()
    let timeoutId: number | null = null

    if (timeout && typeof window !== 'undefined') {
      try {
        timeoutId = window.setTimeout(() => controller.abort(), timeout)
      } catch {
        // no-op if setTimeout is unavailable (very rare)
      }
    }

    const config: RequestInit = {
      method,
      headers,
      signal: controller.signal
    }
      // Always include credentials to support cookie-based auth
      ; (config as any).credentials = 'include'

    // Add body if present
    if (body) {
      config.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`

      const response = await fetch(fullUrl, config)

      // Clear pending timeout on successful response arrival
      if (timeoutId) {
        try { clearTimeout(timeoutId) } catch { /* ignore */ }
      }

      // Handle different response types
      const contentType = response.headers.get('content-type')
      let data: any

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      // Handle HTTP errors
      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          // Don't automatically redirect for login/register requests - let them handle their own errors
          if (endpoint === '/login' || endpoint === '/register' || suppressAuthRedirect) {
            // For login/register, just throw the error with the backend message
            const errorMessage = data?.message || 'Authentication failed'
            throw new APIError(errorMessage, 401, data)
          }

          // For other requests, handle as expired/invalid session
          // Branded overlay to avoid login flash
          try {
            const existing = document.getElementById('page-transition-overlay')
            if (!existing) {
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

              const container = document.createElement('div')
              container.style.display = 'flex'
              container.style.flexDirection = 'column'
              container.style.alignItems = 'center'
              container.style.gap = '12px'

              const spinner = document.createElement('div')
              spinner.style.width = '44px'
              spinner.style.height = '44px'
              spinner.style.border = '4px solid rgba(0,0,0,0.08)'
              spinner.style.borderTop = '4px solid #f97316'
              spinner.style.borderRadius = '50%'
              try { spinner.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 800, iterations: Infinity }) } catch { }

              const label = document.createElement('div')
              label.textContent = 'Loading...'
              label.style.fontSize = '14px'
              label.style.color = '#4b5563'
              label.style.fontWeight = '600'

              container.appendChild(spinner)
              container.appendChild(label)
              overlay.appendChild(container)
              document.body.appendChild(overlay)
              requestAnimationFrame(() => { overlay.style.opacity = '1' })
            }
          } catch { }
          // Clear invalid token and all session data
          safeRemoveItem('access_token')
          safeRemoveItem('user_data')
          safeRemoveItem('supabase_refresh_token')
          safeRemoveItem('supabase_session_id')
          safeRemoveItem('supabase_user_id')
          // Redirect to landing page
          setTimeout(() => window.location.replace('/landing'), 200)
          throw new APIError('Authentication required. Please log in again.', 401)
        }

        // Handle 403 Forbidden
        if (response.status === 403) {
          throw new APIError('Access denied. You do not have permission to perform this action.', 403)
        }

        // Handle 404 Not Found
        if (response.status === 404) {
          throw new APIError('Resource not found. Please check the URL and try again.', 404)
        }

        // Handle 500+ server errors with better fallback messages
        if (response.status >= 500) {
          console.error(`Server error ${response.status}:`, data)

          // Provide user-friendly fallback messages based on endpoint
          let fallbackMessage = 'Server error. Please try again later.'
          if (endpoint.includes('detection_history')) {
            fallbackMessage = 'Unable to load detection history. Please try again later.'
          } else if (endpoint.includes('meal_plan')) {
            fallbackMessage = 'Unable to save/load meal plans. Please try again later.'
          } else if (endpoint.includes('feedback')) {
            fallbackMessage = 'Unable to save feedback. Please try again later.'
          }

          throw new APIError(fallbackMessage, response.status, data)
        }

        // Handle other client errors
        const errorMessage = data?.message || data || `HTTP ${response.status}: ${response.statusText}`
        throw new APIError(errorMessage, response.status, data)
      }

      return data
    } catch (error) {
      // Clear pending timeout in error path as well
      // (AbortController may trigger an exception before response object exists)
      try {
        // @ts-ignore - timeoutId may be null
        if (timeoutId) clearTimeout(timeoutId)
      } catch { /* ignore */ }
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError('Network error. Please check your connection and try again.', 0)
      }

      // Handle timeout errors
      // Different browsers surface abort/timeout differently. Treat AbortError as timeout.
      if (
        (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) ||
        // Some environments surface aborts as generic Errors
        (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted')))
      ) {
        throw new APIError('Request timeout. Please try again.', 0)
      }

      // Re-throw API errors
      if (error instanceof APIError) {
        throw error
      }

      // Handle other errors
      throw new APIError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`, 0)
    }
  }

  // Generic request methods
  async get<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body })
  }

  async put<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async delete<T = any>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' })
  }

  async patch<T = any>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  // Auth-specific methods
  async login(credentials: { email: string; password: string }): Promise<LoginResponse> {
    return this.post('/login', credentials, { skipAuth: true })
  }

  async register(userData: { email: string; password: string; first_name?: string; last_name?: string; name?: string }): Promise<RegisterResponse> {
    return this.post('/register', userData, { skipAuth: true })
  }

  // Meal plan methods
  async getMealPlans(): Promise<APIResponse> {
    return this.get('/meal_plan')
  }

  async saveMealPlan(planData: any): Promise<APIResponse> {
    return this.post('/meal_plans', { plan_data: planData, created_at: new Date().toISOString() })
  }

  async updateMealPlan(id: string, planData: any): Promise<APIResponse> {
    return this.put(`/meal_plans/${id}`, planData)
  }

  async deleteMealPlan(id: string): Promise<APIResponse> {
    return this.delete(`/meal_plans/${id}`)
  }

  async clearMealPlans(): Promise<APIResponse> {
    return this.delete('/meal_plans/clear')
  }

  // Detection history methods
  async getDetectionHistory(): Promise<APIResponse> {
    return this.get('/food_detection/detection_history')
  }

  async saveDetectionHistory(detectionData: any): Promise<APIResponse> {
    return this.post('/food_detection/detection_history', detectionData)
  }

  async deleteDetectionHistory(id: string): Promise<APIResponse> {
    return this.delete(`/food_detection/detection_history/${id}`)
  }

  // Feedback methods
  async saveFeedback(feedbackText: string): Promise<APIResponse> {
    return this.post('/feedback', { feedback_text: feedbackText })
  }

  // Profile methods
  async getUserProfile(): Promise<APIResponse> {
    return this.get('/profile')
  }
}

// Create singleton instance
export const api = new APIService()

// Hook for using API with auth context
export const useAPI = () => {
  const { token, isAuthenticated } = useAuth()

  return {
    api,
    isAuthenticated,
    hasToken: !!token
  }
} 