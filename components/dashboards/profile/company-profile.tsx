"use client"

import { useState } from "react"
import type { User } from "next-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Shield, Bell, Building, Users, PlusCircle } from "lucide-react"

interface CompanyProfileProps {
  user: User
}

export function CompanyProfile({ user }: CompanyProfileProps) {
  const [companyName, setCompanyName] = useState("Global Finance Ltd")
  const [companyDomain, setCompanyDomain] = useState("globalfinance.com")

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Organization Profile</h1>
            <p className="text-warm-gray">Manage your company details and team members</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="organization" className="data-[state=active]:bg-alabaster">
            Organization
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-alabaster">
            Team Management
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-alabaster">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Organization Tab */}
        <TabsContent value="organization">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Company Information</CardTitle>
              <CardDescription className="text-warm-gray">
                Update your company's public details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder-logo.png" alt={companyName} />
                  <AvatarFallback>{companyName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
                    <Upload className="mr-2 h-4 w-4" />
                    Change Logo
                  </Button>
                  <p className="text-xs text-warm-gray">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-charcoal">Company Name</Label>
                  <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-alabaster" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-domain" className="text-charcoal">Company Domain</Label>
                  <Input id="company-domain" value={companyDomain} onChange={(e) => setCompanyDomain(e.target.value)} className="bg-alabaster" />
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex justify-between items-center">
              <div>
                <CardTitle className="text-charcoal">Team Members</CardTitle>
                <CardDescription className="text-warm-gray">
                  Invite and manage your organization's users.
                </CardDescription>
              </div>
              <Button className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </CardHeader>
            <CardContent>
              {/* Placeholder for team members list */}
              <div className="border border-warm-gray/20 rounded-lg p-4 text-center text-warm-gray">
                <Users className="mx-auto h-12 w-12" />
                <p className="mt-4">Team members will be listed here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Account Settings</CardTitle>
              <CardDescription className="text-warm-gray">
                Update your security and notification preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-charcoal flex items-center">
                  <Shield className="mr-2 h-5 w-5" /> Password
                </h3>
                <Separator className="my-4 bg-warm-gray/20" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" className="bg-alabaster" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" className="bg-alabaster" />
                  </div>
                </div>
                 <Button variant="outline" className="mt-4 px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
