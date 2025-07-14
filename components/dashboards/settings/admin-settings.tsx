"use client"

import { User } from "next-auth"

interface AdminSettingsProps {
  user: User
}

export function AdminSettings({ user }: AdminSettingsProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <p>Welcome, {user.name}!</p>
      {/* Add admin-specific settings here */}
    </div>
  )
}
