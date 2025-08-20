"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setMessage("Verification token is missing.")
        setIsSuccess(false)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setMessage(data.message || "Email verified successfully!")
          setIsSuccess(true)
        } else {
          setMessage(data.message || "Email verification failed.")
          setIsSuccess(false)
        }
      } catch (error: any) {
        setMessage(error.message || "An error occurred during verification.")
        setIsSuccess(false)
      } finally {
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [token])

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
              Verify your account to access your intelligent workspace
            </p>
        </div>

        <Card className="bg-parchment border-warm-gray/20 shadow-soft-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-charcoal">Email Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {isLoading ? (
              <p className="text-charcoal">Verifying...</p>
            ) : (
              <>
                {isSuccess ? (
                  <Alert className="border-success-green/20 bg-success-green/10">
                    <CheckCircle className="h-4 w-4 text-success-green" />
                    <AlertDescription className="text-success-green">{message}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-warning-ochre/20 bg-warning-ochre/10">
                    <AlertCircle className="h-4 w-4 text-warning-ochre" />
                    <AlertDescription className="text-warning-ochre">{message}</AlertDescription>
                  </Alert>
                )}
                <Link href="/auth/signin" className="text-charcoal hover:underline font-medium transition-soft">
                  Go to Sign In
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
