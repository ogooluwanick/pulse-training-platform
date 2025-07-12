"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import Link from "next/link"
import { validateUser, authService } from "@/lib/auth"
import { TopMenu } from "@/components/top-menu"

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const returnUrl = searchParams.get("returnUrl")
      router.push(returnUrl || "/dashboard")
    }
  }, [router, searchParams])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const user = await validateUser(email, password)

      if (user) {
        authService.setUser(user)

        // Redirect to return URL or dashboard
        const returnUrl = searchParams.get("returnUrl")
        router.push(returnUrl || "/dashboard")
      } else {
        setError("Invalid email or password")
      }
    } catch (err) {
      setError("An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      <TopMenu />
      <div className="flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster">
                <span className="text-lg font-bold">P</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-charcoal">Welcome to Pulse</h1>
            <p className="text-warm-gray">Sign in to your intelligent workspace</p>
          </div>

          {/* Sign In Card */}
          <Card className="bg-parchment border-warm-gray/20 shadow-soft-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl text-charcoal">Sign in to your account</CardTitle>
              <CardDescription className="text-warm-gray">Enter your credentials to continue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-warning-ochre/20 bg-warning-ochre/10">
                  <AlertCircle className="h-4 w-4 text-warning-ochre" />
                  <AlertDescription className="text-warning-ochre">{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Sign In Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-charcoal font-medium">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-charcoal font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-warm-gray" />
                      ) : (
                        <Eye className="h-4 w-4 text-warm-gray" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="rounded border-warm-gray/30 text-charcoal focus:ring-charcoal"
                    />
                    <Label htmlFor="remember" className="text-sm text-warm-gray">
                      Remember me
                    </Label>
                  </div>
                  <Link href="/auth/forgot-password" className="text-sm text-charcoal hover:underline transition-soft">
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="btn-primary w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="text-center text-sm text-warm-gray">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-charcoal hover:underline font-medium transition-soft">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Demo Credentials */}
          <Card className="bg-alabaster border-warm-gray/20 shadow-soft">
            <CardContent className="p-4">
              <div className="space-y-3">
                <h3 className="font-medium text-charcoal text-center">Demo Credentials</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Admin:</span>
                    <span className="text-charcoal">admin@pulse.com / password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Company:</span>
                    <span className="text-charcoal">company@example.com / password123</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm-gray">Employee:</span>
                    <span className="text-charcoal">employee@example.com / password123</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
