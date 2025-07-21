"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Building, Shield } from "lucide-react"

// Define the props for the ProfileTabs component
interface ProfileTabsProps {
  role: "admin" | "company" | "employee" | null
  children: React.ReactNode
}

export default function ProfileTabs({ role, children }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="personal">
      <TabsList className="bg-parchment border border-warm-gray/20">
        <TabsTrigger value="personal" className="data-[state=active]:bg-alabaster">
          <User className="mr-2 h-4 w-4" />
          Personal
        </TabsTrigger>
        {role === "company" && (
          <TabsTrigger value="company" className="data-[state=active]:bg-alabaster">
            <Building className="mr-2 h-4 w-4" />
            Company
          </TabsTrigger>
        )}
        <TabsTrigger value="security" className="data-[state=active]:bg-alabaster">
          <Shield className="mr-2 h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}
