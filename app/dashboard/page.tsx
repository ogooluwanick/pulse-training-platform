"use client"

import { useSession } from "next-auth/react"
import { EmployeeDashboard } from "@/components/dashboards/employee-dashboard"
import { CompanyDashboard } from "@/components/dashboards/company-dashboard"
import { AdminDashboard } from "@/components/dashboards/admin-dashboard"
import FullPageLoader from "@/components/full-page-loader"

export default function Dashboard() {
  const { data: session, status } = useSession()

  const user = session?.user

  if (status === "loading" || !user) {
    return <FullPageLoader />
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
