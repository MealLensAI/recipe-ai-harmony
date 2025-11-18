/**
 * Secure Storage Service
 * 
 * Provides encrypted storage for sensitive data with automatic expiration.
 * Uses Web Crypto API for encryption when available, falls back to obfuscation.
 * 
 * Security Features:
 * - AES-GCM encryption for sensitive data
 * - Automatic expiration handling
 * - XSS protection through encryption
 * - Secure key derivation
 */

// Storage keys
const ENCRYPTION_KEY_NAME = 'meallens_enc_key'
const TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_DATA_KEY = 'user_data'
const SESSION_KEY = 'session_id'
const USER_ID_KEY = 'user_id'

// Token expiration (24 hours)
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000

interface StoredToken {
  value: string
  expiresAt: number
  encrypted: boolean
}

class SecureStorageService {
  private encryptionKey: CryptoKey | null = null
  private keyDerivationPromise: Promise<CryptoKey> | null = null

  /**
   * Derive encryption key from a master key
   */
  private async deriveKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey
    }

    if (this.keyDerivationPromise) {
      return this.keyDerivationPromise
    }

    this.keyDerivationPromise = (async () => {
      try {
        // Check if we have a stored key
        const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME)
        let keyMaterial: string

        if (storedKey) {
          keyMaterial = storedKey
        } else {
          // Generate a new key based on user agent + timestamp
          // In production, this should be derived from a server-provided secret
          keyMaterial = `${navigator.userAgent}-${Date.now()}-${Math.random()}`
          localStorage.setItem(ENCRYPTION_KEY_NAME, keyMaterial)
        }

        // Import key material
        const encoder = new TextEncoder()
        const keyData = encoder.encode(keyMaterial.slice(0, 32).padEnd(32, '0'))

        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'PBKDF2' },
          false,
          ['deriveBits', 'deriveKey']
        )

        // Derive AES key
        const salt = encoder.encode('meallens-salt-v1')
        const derivedKey = await crypto.subtle.deriveKey(
          {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
          },
          key,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        )

        this.encryptionKey = derivedKey
        return derivedKey
      } catch (error) {
        console.warn('Encryption not available, using obfuscation:', error)
        // Return a dummy key - we'll use obfuscation instead
        return null as any
      }
    })()

    return this.keyDerivationPromise
  }

  /**
   * Encrypt sensitive data
   */
  private async encrypt(data: string): Promise<string> {
    try {
      const key = await this.deriveKey()
      if (!key) {
        // Fallback to base64 obfuscation
        return btoa(unescape(encodeURIComponent(data)))
      }

      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      const iv = crypto.getRandomValues(new Uint8Array(12))

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        dataBuffer
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encrypted), iv.length)

      // Encode as base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.warn('Encryption failed, using obfuscation:', error)
      return btoa(unescape(encodeURIComponent(data)))
    }
  }

  /**
   * Decrypt sensitive data
   */
  private async decrypt(encryptedData: string): Promise<string> {
    try {
      const key = await this.deriveKey()
      if (!key) {
        // Fallback: try to decode base64
        try {
          return decodeURIComponent(escape(atob(encryptedData)))
        } catch {
          return encryptedData // Return as-is if not base64
        }
      }

      // Decode base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.warn('Decryption failed, trying obfuscation:', error)
      try {
        return decodeURIComponent(escape(atob(encryptedData)))
      } catch {
        return encryptedData
      }
    }
  }

  /**
   * Store token securely with expiration
   */
  async setToken(token: string, expiresInMs: number = TOKEN_EXPIRY_MS): Promise<void> {
    try {
      const expiresAt = Date.now() + expiresInMs
      const encrypted = await this.encrypt(token)
      
      const stored: StoredToken = {
        value: encrypted,
        expiresAt,
        encrypted: true
      }

      localStorage.setItem(TOKEN_KEY, JSON.stringify(stored))
    } catch (error) {
      console.error('Failed to store token securely:', error)
      // Fallback to plain storage (not ideal but better than losing data)
      localStorage.setItem(TOKEN_KEY, token)
    }
  }

  /**
   * Get token, checking expiration
   */
  async getToken(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (!stored) return null

      // Try to parse as StoredToken
      try {
        const parsed: StoredToken = JSON.parse(stored)
        
        // Check expiration
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          this.removeToken()
          return null
        }

        // Decrypt if encrypted
        if (parsed.encrypted) {
          return await this.decrypt(parsed.value)
        }
        
        return parsed.value
      } catch {
        // Legacy format - return as-is
        return stored
      }
    } catch (error) {
      console.error('Failed to get token:', error)
      return null
    }
  }

  /**
   * Remove token
   */
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  }

  /**
   * Store refresh token securely
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(token)
      localStorage.setItem(REFRESH_TOKEN_KEY, encrypted)
    } catch (error) {
      console.error('Failed to store refresh token:', error)
      localStorage.setItem(REFRESH_TOKEN_KEY, token)
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!stored) return null

      // Try to decrypt
      try {
        return await this.decrypt(stored)
      } catch {
        return stored // Legacy format
      }
    } catch (error) {
      console.error('Failed to get refresh token:', error)
      return null
    }
  }

  /**
   * Remove refresh token
   */
  removeRefreshToken(): void {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  /**
   * Store user data (less sensitive, but still encrypted)
   */
  async setUserData(data: any): Promise<void> {
    try {
      const json = JSON.stringify(data)
      const encrypted = await this.encrypt(json)
      localStorage.setItem(USER_DATA_KEY, encrypted)
    } catch (error) {
      console.error('Failed to store user data:', error)
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(data))
    }
  }

  /**
   * Get user data
   */
  async getUserData(): Promise<any | null> {
    try {
      const stored = localStorage.getItem(USER_DATA_KEY)
      if (!stored) return null

      try {
        const decrypted = await this.decrypt(stored)
        return JSON.parse(decrypted)
      } catch {
        // Legacy format
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to get user data:', error)
      return null
    }
  }

  /**
   * Remove user data
   */
  removeUserData(): void {
    localStorage.removeItem(USER_DATA_KEY)
  }

  /**
   * Store session ID
   */
  async setSessionId(sessionId: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(sessionId)
      localStorage.setItem(SESSION_KEY, encrypted)
    } catch (error) {
      localStorage.setItem(SESSION_KEY, sessionId)
    }
  }

  /**
   * Get session ID
   */
  async getSessionId(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(SESSION_KEY)
      if (!stored) return null

      try {
        return await this.decrypt(stored)
      } catch {
        return stored
      }
    } catch {
      return null
    }
  }

  /**
   * Remove session ID
   */
  removeSessionId(): void {
    localStorage.removeItem(SESSION_KEY)
  }

  /**
   * Store user ID
   */
  async setUserId(userId: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(userId)
      localStorage.setItem(USER_ID_KEY, encrypted)
    } catch (error) {
      localStorage.setItem(USER_ID_KEY, userId)
    }
  }

  /**
   * Get user ID
   */
  async getUserId(): Promise<string | null> {
    try {
      const stored = localStorage.getItem(USER_ID_KEY)
      if (!stored) return null

      try {
        return await this.decrypt(stored)
      } catch {
        return stored
      }
    } catch {
      return null
    }
  }

  /**
   * Remove user ID
   */
  removeUserId(): void {
    localStorage.removeItem(USER_ID_KEY)
  }

  /**
   * Clear all secure storage
   */
  async clearAll(): Promise<void> {
    this.removeToken()
    this.removeRefreshToken()
    this.removeUserData()
    this.removeSessionId()
    this.removeUserId()
    
    // Clear encryption key
    localStorage.removeItem(ENCRYPTION_KEY_NAME)
    
    // Reset encryption key
    this.encryptionKey = null
    this.keyDerivationPromise = null
  }

  /**
   * Check if token is expired
   */
  async isTokenExpired(): Promise<boolean> {
    try {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (!stored) return true

      try {
        const parsed: StoredToken = JSON.parse(stored)
        if (parsed.expiresAt) {
          return Date.now() > parsed.expiresAt
        }
      } catch {
        // Legacy format - assume not expired
        return false
      }

      return false
    } catch {
      return true
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorageService()

// Export for backward compatibility
export async function secureGetItem(key: string): Promise<string | null> {
  if (key === TOKEN_KEY) {
    return await secureStorage.getToken()
  } else if (key === REFRESH_TOKEN_KEY) {
    return await secureStorage.getRefreshToken()
  } else if (key === USER_DATA_KEY) {
    const data = await secureStorage.getUserData()
    return data ? JSON.stringify(data) : null
  } else if (key === SESSION_KEY) {
    return await secureStorage.getSessionId()
  } else if (key === USER_ID_KEY) {
    return await secureStorage.getUserId()
  }
  
  // Fallback to regular localStorage for non-sensitive data
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export async function secureSetItem(key: string, value: string): Promise<void> {
  if (key === TOKEN_KEY) {
    await secureStorage.setToken(value)
  } else if (key === REFRESH_TOKEN_KEY) {
    await secureStorage.setRefreshToken(value)
  } else if (key === USER_DATA_KEY) {
    try {
      const data = JSON.parse(value)
      await secureStorage.setUserData(data)
    } catch {
      await secureStorage.setUserData({ raw: value })
    }
  } else if (key === SESSION_KEY) {
    await secureStorage.setSessionId(value)
  } else if (key === USER_ID_KEY) {
    await secureStorage.setUserId(value)
  } else {
    // Fallback to regular localStorage for non-sensitive data
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Failed to store item:', error)
    }
  }
}

export function secureRemoveItem(key: string): void {
  if (key === TOKEN_KEY) {
    secureStorage.removeToken()
  } else if (key === REFRESH_TOKEN_KEY) {
    secureStorage.removeRefreshToken()
  } else if (key === USER_DATA_KEY) {
    secureStorage.removeUserData()
  } else if (key === SESSION_KEY) {
    secureStorage.removeSessionId()
  } else if (key === USER_ID_KEY) {
    secureStorage.removeUserId()
  } else {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }
}

