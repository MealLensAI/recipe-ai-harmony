import { useAuth } from './utils'

// API base URL - uses relative path for proxy in development
const API_BASE_URL = '/api'

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

// Request options type
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  headers?: Record<string, string>
  skipAuth?: boolean
  timeout?: number
}

// Centralized API service
class APIService {
  private getAuthToken(): string | null {
    return localStorage.getItem('access_token')
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
      timeout = 10000
    } = options

    // Add auth header if not skipped
    if (!skipAuth) {
      const token = this.getAuthToken()
      if (!token) {
        // Clear any stale data and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('supabase_refresh_token')
        localStorage.removeItem('supabase_session_id')
        localStorage.removeItem('supabase_user_id')
        window.location.href = '/login'
        throw new APIError('No authentication token found. Please log in again.', 401)
      }
      headers['Authorization'] = `Bearer ${token}`
    }

    // Add default headers
    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    // Prepare request config
    const config: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(timeout)
    }

    // Add body if present
    if (body) {
      config.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    try {
      const fullUrl = `${API_BASE_URL}${endpoint}`

      const response = await fetch(fullUrl, config)

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
          // Clear invalid token and all session data
          localStorage.removeItem('access_token')
          localStorage.removeItem('user_data')
          localStorage.removeItem('supabase_refresh_token')
          localStorage.removeItem('supabase_session_id')
          localStorage.removeItem('supabase_user_id')
          // Redirect to login
          window.location.href = '/login'
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
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new APIError('Network error. Please check your connection and try again.', 0)
      }

      // Handle timeout errors
      if (error instanceof DOMException && error.name === 'TimeoutError') {
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
  async login(credentials: { email: string; password: string }): Promise<APIResponse> {
    return this.post('/login', credentials, { skipAuth: true })
  }

  async register(userData: { email: string; password: string; first_name?: string; last_name?: string; name?: string }): Promise<APIResponse> {
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

  async updatePassword(newPassword: string): Promise<APIResponse> {
    return this.post('/update-password', { new_password: newPassword })
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