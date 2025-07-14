"use client"

import { useState } from "react"
import type { User } from "next-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Bell, Settings, Mail, Key } from "lucide-react"

interface AdminProfileProps {
  user: User
}

export function AdminProfile({ user }: AdminProfileProps) {
  const [name, setName] = useState(user.name ?? "")
  const [email, setEmail] = useState(user.email ?? "")

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Admin Settings</h1>
            <p className="text-warm-gray">Manage platform-wide configurations</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="general" className="data-[state=active]:bg-alabaster">
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-alabaster">
            Security
          </TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-alabaster">
            Email Templates
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Platform Settings</CardTitle>
              <CardDescription className="text-warm-gray">
                Configure general settings for the entire platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="platform-name" className="text-charcoal">Platform Name</Label>
                <Input id="platform-name" defaultValue="Pulse Training Platform" className="bg-alabaster" />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-warm-gray/20 p-4">
                <div>
                  <Label htmlFor="allow-signup" className="font-medium text-charcoal">Allow Public Signups</Label>
                  <p className="text-sm text-warm-gray">Allow new users to register accounts themselves.</p>
                </div>
                <Switch id="allow-signup" />
              </div>
              <div className="flex justify-end">
                <Button className="btn-primary">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Security Settings</CardTitle>
              <CardDescription className="text-warm-gray">
                Manage security-related settings for the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-warm-gray/20 p-4">
                <div>
                  <Label htmlFor="mfa" className="font-medium text-charcoal">Enforce Multi-Factor Authentication</Label>
                  <p className="text-sm text-warm-gray">Require all users to set up MFA.</p>
                </div>
                <Switch id="mfa" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-timeout" className="text-charcoal">Session Timeout (minutes)</Label>
                <Input id="session-timeout" type="number" defaultValue={60} className="bg-alabaster" />
              </div>
              <div className="flex justify-end">
                <Button className="btn-primary">Save Security Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates Tab */}
        <TabsContent value="email">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Email Templates</CardTitle>
              <CardDescription className="text-warm-gray">
                Customize the emails sent by the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="bg-transparent border-warm-gray/30">
                <Mail className="mr-2 h-4 w-4" />
                Welcome Email
              </Button>
              <Button variant="outline" className="bg-transparent border-warm-gray/30">
                <Key className="mr-2 h-4 w-4" />
                Password Reset Email
              </Button>
              <Button variant="outline" className="bg-transparent border-warm-gray/30">
                <Bell className="mr-2 h-4 w-4" />
                Notification Email
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
