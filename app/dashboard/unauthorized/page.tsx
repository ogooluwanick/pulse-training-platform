"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f4ed] dark:bg-gray-900">
      <Card className="w-full max-w-md text-center bg-white  shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-red-600">
            Unauthorized Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
            Sorry, you do not have the necessary permissions to view this page.
          </p>
          <Button
            onClick={() => router.back()}
            className="w-full px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
            >
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
