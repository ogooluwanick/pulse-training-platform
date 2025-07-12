"use client"

import { useSession } from "next-auth/react"
import { EmployeeDashboard } from "@/components/dashboards/employee-dashboard"
import { CompanyDashboard } from "@/components/dashboards/company-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"

export default function Dashboard() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-charcoal text-alabaster mx-auto animate-pulse">
            <span className="text-lg font-bold">P</span>
          </div>
          <p className="text-warm-gray">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>
  }

  const user = session?.user

  if (!user) {
    return <p>Something went wrong</p>
  }

  // Render different dashboards based on user role
  switch (user.role) {
    case "EMPLOYEE":
      return <EmployeeDashboard user={user} />
    case "COMPANY":
      return <CompanyDashboard user={user} />
    case "ADMIN":
      return <AdminDashboard user={user} />
    default:
      return <EmployeeDashboard user={user} />
  }
}
