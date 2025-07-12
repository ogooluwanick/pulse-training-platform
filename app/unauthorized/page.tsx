import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-alabaster flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-parchment border-warm-gray/20 shadow-soft-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning-ochre/10">
              <AlertTriangle className="h-8 w-8 text-warning-ochre" />
            </div>
          </div>
          <CardTitle className="text-2xl text-charcoal">Access Denied</CardTitle>
          <CardDescription className="text-warm-gray">
            You don't have permission to access this resource. Please contact your administrator if you believe this is
            an error.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <Link href="/dashboard">
              <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster">Go to Dashboard</Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full border-warm-gray/30 hover:bg-parchment bg-transparent">
                Sign In as Different User
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
