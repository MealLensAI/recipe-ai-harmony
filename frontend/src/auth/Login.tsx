"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Mail, Lock, Utensils, Loader2 } from "lucide-react"
import { useAuth, safeSetItem, safeGetItem } from "@/lib/utils"
import { api, APIError } from "@/lib/api"

const Login = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { isAuthenticated, refreshAuth } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const role = safeGetItem("user_role")
      if (role === "organization") navigate("/organization/dashboard", { replace: true })
      else navigate("/dashboard", { replace: true })
    }
  }, [isAuthenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }
    setIsLoading(true)

    try {
      const result = await api.login({ email, password })
      console.log("[Login] Response:", result)

      if (result.status === "success" && result.access_token) {
        // --- Save tokens ---
        safeSetItem("access_token", result.access_token)
        safeSetItem("supabase_refresh_token", result.refresh_token || "")
        safeSetItem("supabase_session_id", result.session_id || "")
        safeSetItem("supabase_user_id", result.user_id || "")
        
        

        // --- Extract role from backend ---
        // The backend stores signup_type in user_data.metadata.signup_type
        // Map signup_type to role: "organization" -> "organization", "individual" -> "individual"
        const signupType = result?.user_data?.metadata?.signup_type
        const role = signupType === "organization" ? "organization" : "individual"
        
        if (!signupType) {
          console.warn("No signup_type found in backend response, defaulting to 'individual'")
        } else {
          console.log(`User role determined from signup_type: ${signupType} -> ${role}`)
        }

        // save role
        safeSetItem("user_role", role)

        // save user data (consistent auth context)
        const displayName = (result.user_data?.email || email).split("@")[0]
        const userData = {
          uid: result.user_id || result.user_data?.id || "",
          email: result.user_data?.email || email,
          displayName,
          role, // store role here
        }

        safeSetItem("user_data", JSON.stringify(userData))

        // refresh global auth state
        await refreshAuth()

        toast({
          title: "Welcome back!",
          description: "You have been successfully logged in.",
        })

        // --- Role-based redirect logic ---
        if (role === "organization") {
          navigate("/organization/dashboard", { replace: true })
        } else {
          navigate("/dashboard", { replace: true })
        }
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid email or password.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)

      toast({
        title: "Login Failed",
        description:
          error instanceof APIError
            ? error.message
            : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=100&width=100')] opacity-5 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl shadow-lg flex items-center justify-center">
              <Utensils className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            MealLensAI
          </h1>
          <p className="text-gray-600 text-sm">Smart Food Detection & Recipe Generation</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <p className="text-center text-gray-600">
              Sign in to your account to continue
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Forgot Password */}
              <div className="text-right text-sm">
                <Link
                  to="/forgot-password"
                  className="text-orange-600 hover:text-orange-700"
                >
                  Forgot password?
                </Link>
              </div>
            </form>

            {/* Sign Up */}
            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-orange-600 hover:text-orange-700"
              >
                Sign up here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
