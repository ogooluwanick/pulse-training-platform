"use client"

import { User } from "next-auth"

interface EmployeeSettingsProps {
  user: User
}

export function EmployeeSettings({ user }: EmployeeSettingsProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Employee Settings</h1>
      <p>Welcome, {user.name}!</p>
      {/* Add employee-specific settings here */}
    </div>
  )
}
