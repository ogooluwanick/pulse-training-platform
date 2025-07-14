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
import { Upload, Shield, Bell, Palette } from "lucide-react"

interface EmployeeProfileProps {
  user: User
}

export function EmployeeProfile({ user }: EmployeeProfileProps) {
  const [name, setName] = useState(user.name ?? "")
  const [email, setEmail] = useState(user.email ?? "")

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Profile & Settings</h1>
            <p className="text-warm-gray">Manage your personal information and preferences</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="profile" className="data-[state=active]:bg-alabaster">
            Profile
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-alabaster">
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">Personal Information</CardTitle>
              <CardDescription className="text-warm-gray">
                This is your public profile information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image ?? "/placeholder-user.jpg"} alt={user.name ?? ""} />
                  <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="bg-transparent border-warm-gray/30">
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-warm-gray">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-charcoal">Full Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-alabaster" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-charcoal">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-alabaster" />
                </div>
                <div className="space-y-2">
                  <Label className="text-charcoal">Role</Label>
                  <p className="text-charcoal p-2 bg-alabaster rounded-md border border-warm-gray/20 capitalize">{user.role}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-charcoal">Team</Label>
                   <p className="text-charcoal p-2 bg-alabaster rounded-md border border-warm-gray/20">Customer Success</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button className="btn-primary">Save Changes</Button>
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
              {/* Change Password */}
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
                 <Button variant="outline" className="mt-4 bg-transparent border-warm-gray/30">Update Password</Button>
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className="text-lg font-medium text-charcoal flex items-center">
                  <Bell className="mr-2 h-5 w-5" /> Notifications
                </h3>
                <Separator className="my-4 bg-warm-gray/20" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-warm-gray/20 p-4">
                    <div>
                      <Label htmlFor="email-notifications" className="font-medium text-charcoal">Email Notifications</Label>
                      <p className="text-sm text-warm-gray">Receive updates and reminders via email.</p>
                    </div>
                    <Switch id="email-notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-warm-gray/20 p-4">
                    <div>
                      <Label htmlFor="push-notifications" className="font-medium text-charcoal">Push Notifications</Label>
                      <p className="text-sm text-warm-gray">Get notified directly in the app.</p>
                    </div>
                    <Switch id="push-notifications" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
