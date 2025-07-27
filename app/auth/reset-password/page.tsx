"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react" // Added CheckCircle
import Link from "next/link" // Added Link

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")
    setIsSuccess(false)

    const formData = new FormData(e.currentTarget)
    const newPassword = formData.get("newPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!token) {
      setMessage("Invalid token.")
      setIsSuccess(false)
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.")
      setIsSuccess(false)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || "Password reset successfully!")
        setIsSuccess(true)
      } else {
        setMessage(data.message || "Password reset failed.")
        setIsSuccess(false)
      }
    } catch (error: any) {
      setMessage(error.message || "An error occurred.")
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#fcf8f9" }}>
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster">
              <span className="text-lg font-bold">P</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-charcoal">
              Welcome to Pulse
            </h1>
            <p className="text-warm-gray">
              Sign in to your intelligent workspace
            </p>
        </div>

        <Card className="bg-parchment border-warm-gray/20 shadow-soft-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-charcoal">Set New Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              isSuccess ? (
                <Alert className="border-success-green/20 bg-success-green/10">
                  <CheckCircle className="h-4 w-4 text-success-green" />
                  <AlertDescription className="text-success-green">{message}</AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-warning-ochre/20 bg-warning-ochre/10">
                  <AlertCircle className="h-4 w-4 text-warning-ochre" />
                  <AlertDescription className="text-warning-ochre">{message}</AlertDescription>
                </Alert>
              )
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-charcoal font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-charcoal font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal transition-soft pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-warm-gray" />
                    ) : (
                      <Eye className="h-4 w-4 text-warm-gray" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-charcoal text-white hover:bg-charcoal/90" disabled={isLoading}>
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>

            <div className="text-center text-sm text-warm-gray">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-charcoal hover:underline font-medium transition-soft">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
