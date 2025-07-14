"use client"

import { User } from "next-auth"

interface CompanySettingsProps {
  user: User
}

export function CompanySettings({ user }: CompanySettingsProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Company Settings</h1>
      <p>Welcome, {user.name}!</p>
      {/* Add company-specific settings here */}
    </div>
  )
}
