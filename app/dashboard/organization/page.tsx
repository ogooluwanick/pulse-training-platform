"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Users, CreditCard, Settings, Upload, Download, Mail, Shield, FileText, AlertTriangle } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

interface OrganizationSettings {
  name: string
  domain: string
  industry: string
  size: string
  timezone: string
  language: string
  logo: string
  description: string
  website: string
  phone: string
  address: string
}

interface BillingInfo {
  plan: string
  status: string
  nextBilling: string
  amount: number
  seats: number
  usedSeats: number
}

interface ComplianceSettings {
  dataRetention: number
  auditLogs: boolean
  ssoEnabled: boolean
  mfaRequired: boolean
  passwordPolicy: string
  sessionTimeout: number
}

const mockOrgSettings: OrganizationSettings = {
  name: "TechCorp Solutions",
  domain: "techcorp.com",
  industry: "Technology",
  size: "100-500",
  timezone: "UTC-8",
  language: "English",
  logo: "/placeholder.svg?height=80&width=80",
  description: "Leading technology solutions provider specializing in enterprise software development.",
  website: "https://techcorp.com",
  phone: "+1 (555) 123-4567",
  address: "123 Tech Street, San Francisco, CA 94105",
}

const mockBillingInfo: BillingInfo = {
  plan: "Enterprise",
  status: "Active",
  nextBilling: "2024-02-15",
  amount: 2499,
  seats: 200,
  usedSeats: 150,
}

const mockComplianceSettings: ComplianceSettings = {
  dataRetention: 365,
  auditLogs: true,
  ssoEnabled: true,
  mfaRequired: false,
  passwordPolicy: "Strong",
  sessionTimeout: 480,
}

export default function OrganizationPage() {
  const [orgSettings, setOrgSettings] = useState(mockOrgSettings)
  const [billingInfo, setBillingInfo] = useState(mockBillingInfo)
  const [complianceSettings, setComplianceSettings] = useState(mockComplianceSettings)
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [isInviteAdminDialogOpen, setIsInviteAdminDialogOpen] = useState(false)
  const [adminEmail, setAdminEmail] = useState("")

  const handleSaveSettings = () => {
    console.log("Saving organization settings:", orgSettings)
  }

  const handleSaveCompliance = () => {
    console.log("Saving compliance settings:", complianceSettings)
  }

  const handleUpgradePlan = (newPlan: string) => {
    console.log("Upgrading to plan:", newPlan)
    setIsUpgradeDialogOpen(false)
  }

  const handleInviteAdmin = () => {
    console.log("Inviting admin:", adminEmail)
    setIsInviteAdminDialogOpen(false)
    setAdminEmail("")
  }

  const handleExportData = (type: string) => {
    console.log("Exporting data:", type)
  }

  return (
    <AuthGuard allowedRoles={["COMPANY", "ADMIN"]}>
      <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Organization Settings</h1>
            <p className="text-warm-gray">Manage your organization's profile, billing, and compliance settings</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isInviteAdminDialogOpen} onOpenChange={setIsInviteAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-alabaster border-warm-gray/30">
                  <Mail className="h-4 w-4 mr-2" />
                  Invite Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-charcoal">Invite Organization Admin</DialogTitle>
                  <DialogDescription className="text-warm-gray">
                    Invite someone to help manage your organization
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email" className="text-charcoal">
                      Admin Email
                    </Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@company.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleInviteAdmin} className="btn-primary">
                      Send Invitation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsInviteAdminDialogOpen(false)}
                      className="bg-alabaster"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSaveSettings} className="btn-primary">
              <Settings className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Organization Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-parchment border border-warm-gray/20">
            <TabsTrigger value="profile" className="data-[state=active]:bg-alabaster">
              Organization Profile
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-alabaster">
              Billing & Subscription
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-alabaster">
              Compliance & Security
            </TabsTrigger>
            <TabsTrigger value="data" className="data-[state=active]:bg-alabaster">
              Data Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Basic Information</CardTitle>
                  <CardDescription className="text-warm-gray">Update your organization's basic details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="org-name" className="text-charcoal">
                        Organization Name
                      </Label>
                      <Input
                        id="org-name"
                        value={orgSettings.name}
                        onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                        className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="org-domain" className="text-charcoal">
                        Domain
                      </Label>
                      <Input
                        id="org-domain"
                        value={orgSettings.domain}
                        onChange={(e) => setOrgSettings({ ...orgSettings, domain: e.target.value })}
                        className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="org-industry" className="text-charcoal">
                        Industry
                      </Label>
                      <Select
                        value={orgSettings.industry}
                        onValueChange={(value) => setOrgSettings({ ...orgSettings, industry: value })}
                      >
                        <SelectTrigger className="bg-alabaster border-warm-gray/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="org-size" className="text-charcoal">
                        Company Size
                      </Label>
                      <Select
                        value={orgSettings.size}
                        onValueChange={(value) => setOrgSettings({ ...orgSettings, size: value })}
                      >
                        <SelectTrigger className="bg-alabaster border-warm-gray/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-100">51-100 employees</SelectItem>
                          <SelectItem value="100-500">100-500 employees</SelectItem>
                          <SelectItem value="500+">500+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="org-description" className="text-charcoal">
                      Description
                    </Label>
                    <Textarea
                      id="org-description"
                      value={orgSettings.description}
                      onChange={(e) => setOrgSettings({ ...orgSettings, description: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Contact Information</CardTitle>
                  <CardDescription className="text-warm-gray">Organization contact details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="org-website" className="text-charcoal">
                      Website
                    </Label>
                    <Input
                      id="org-website"
                      value={orgSettings.website}
                      onChange={(e) => setOrgSettings({ ...orgSettings, website: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-phone" className="text-charcoal">
                      Phone
                    </Label>
                    <Input
                      id="org-phone"
                      value={orgSettings.phone}
                      onChange={(e) => setOrgSettings({ ...orgSettings, phone: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="org-address" className="text-charcoal">
                      Address
                    </Label>
                    <Textarea
                      id="org-address"
                      value={orgSettings.address}
                      onChange={(e) => setOrgSettings({ ...orgSettings, address: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="org-timezone" className="text-charcoal">
                        Timezone
                      </Label>
                      <Select
                        value={orgSettings.timezone}
                        onValueChange={(value) => setOrgSettings({ ...orgSettings, timezone: value })}
                      >
                        <SelectTrigger className="bg-alabaster border-warm-gray/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                          <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                          <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                          <SelectItem value="UTC+1">Central European (UTC+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="org-language" className="text-charcoal">
                        Language
                      </Label>
                      <Select
                        value={orgSettings.language}
                        onValueChange={(value) => setOrgSettings({ ...orgSettings, language: value })}
                      >
                        <SelectTrigger className="bg-alabaster border-warm-gray/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="English">English</SelectItem>
                          <SelectItem value="Spanish">Spanish</SelectItem>
                          <SelectItem value="French">French</SelectItem>
                          <SelectItem value="German">German</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Current Subscription</CardTitle>
                  <CardDescription className="text-warm-gray">Your current plan and usage details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-alabaster">
                    <div>
                      <p className="font-medium text-charcoal">{billingInfo.plan} Plan</p>
                      <p className="text-sm text-warm-gray">Next billing: {billingInfo.nextBilling}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-charcoal">${billingInfo.amount}</p>
                      <p className="text-sm text-warm-gray">per month</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-warm-gray">Seats Used</span>
                      <span className="text-charcoal">
                        {billingInfo.usedSeats} / {billingInfo.seats}
                      </span>
                    </div>
                    <div className="w-full bg-warm-gray/20 rounded-full h-2">
                      <div
                        className="bg-success-green h-2 rounded-full"
                        style={{ width: `${(billingInfo.usedSeats / billingInfo.seats) * 100}%` }}
                      />
                    </div>
                  </div>
                  <Badge className="bg-success-green text-alabaster">{billingInfo.status}</Badge>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Upgrade Options</CardTitle>
                  <CardDescription className="text-warm-gray">
                    Explore higher tier plans for more features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-alabaster border border-warm-gray/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-charcoal">Professional</p>
                          <p className="text-sm text-warm-gray">Up to 100 users</p>
                        </div>
                        <p className="text-lg font-bold text-charcoal">$999/mo</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-success-green/10 border border-success-green/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-charcoal">Enterprise</p>
                          <p className="text-sm text-warm-gray">Up to 500 users</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-charcoal">$2499/mo</p>
                          <Badge className="bg-success-green text-alabaster text-xs">Current</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-alabaster border border-warm-gray/20">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-charcoal">Enterprise Plus</p>
                          <p className="text-sm text-warm-gray">Unlimited users</p>
                        </div>
                        <p className="text-lg font-bold text-charcoal">$4999/mo</p>
                      </div>
                    </div>
                  </div>
                  <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full btn-primary">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Upgrade Plan
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-charcoal">Upgrade Subscription</DialogTitle>
                        <DialogDescription className="text-warm-gray">
                          Choose your new plan to unlock additional features
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid gap-3">
                          <Button
                            onClick={() => handleUpgradePlan("Enterprise Plus")}
                            className="btn-primary h-16 flex-col"
                          >
                            <span className="font-bold">Enterprise Plus</span>
                            <span className="text-sm">$4999/mo - Unlimited users</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsUpgradeDialogOpen(false)}
                            className="bg-alabaster"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Security Settings</CardTitle>
                  <CardDescription className="text-warm-gray">
                    Configure security and authentication policies
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Single Sign-On (SSO)</p>
                      <p className="text-xs text-warm-gray">Enable SSO authentication</p>
                    </div>
                    <Switch
                      checked={complianceSettings.ssoEnabled}
                      onCheckedChange={(checked) =>
                        setComplianceSettings({ ...complianceSettings, ssoEnabled: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Multi-Factor Authentication</p>
                      <p className="text-xs text-warm-gray">Require MFA for all users</p>
                    </div>
                    <Switch
                      checked={complianceSettings.mfaRequired}
                      onCheckedChange={(checked) =>
                        setComplianceSettings({ ...complianceSettings, mfaRequired: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Audit Logging</p>
                      <p className="text-xs text-warm-gray">Track all user activities</p>
                    </div>
                    <Switch
                      checked={complianceSettings.auditLogs}
                      onCheckedChange={(checked) =>
                        setComplianceSettings({ ...complianceSettings, auditLogs: checked })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="password-policy" className="text-charcoal">
                      Password Policy
                    </Label>
                    <Select
                      value={complianceSettings.passwordPolicy}
                      onValueChange={(value) => setComplianceSettings({ ...complianceSettings, passwordPolicy: value })}
                    >
                      <SelectTrigger className="bg-alabaster border-warm-gray/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-parchment border-warm-gray/20">
                        <SelectItem value="Basic">Basic (8+ characters)</SelectItem>
                        <SelectItem value="Strong">Strong (12+ chars, mixed case, numbers)</SelectItem>
                        <SelectItem value="Enterprise">Enterprise (16+ chars, symbols required)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="session-timeout" className="text-charcoal">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={complianceSettings.sessionTimeout}
                      onChange={(e) =>
                        setComplianceSettings({
                          ...complianceSettings,
                          sessionTimeout: Number.parseInt(e.target.value),
                        })
                      }
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Data Compliance</CardTitle>
                  <CardDescription className="text-warm-gray">
                    Manage data retention and compliance requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="data-retention" className="text-charcoal">
                      Data Retention Period (days)
                    </Label>
                    <Input
                      id="data-retention"
                      type="number"
                      value={complianceSettings.dataRetention}
                      onChange={(e) =>
                        setComplianceSettings({ ...complianceSettings, dataRetention: Number.parseInt(e.target.value) })
                      }
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                    <p className="text-xs text-warm-gray mt-1">How long to keep user data and activity logs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-warning-ochre/10 border border-warning-ochre/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning-ochre mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">GDPR Compliance</p>
                        <p className="text-xs text-warm-gray">
                          Ensure your data retention policies comply with GDPR requirements
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSaveCompliance} className="w-full btn-primary">
                    <Shield className="h-4 w-4 mr-2" />
                    Save Compliance Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Data Export</CardTitle>
                  <CardDescription className="text-warm-gray">
                    Export your organization's data for backup or migration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleExportData("users")}
                      variant="outline"
                      className="w-full justify-start bg-alabaster border-warm-gray/30"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Export User Data
                    </Button>
                    <Button
                      onClick={() => handleExportData("progress")}
                      variant="outline"
                      className="w-full justify-start bg-alabaster border-warm-gray/30"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Export Learning Progress
                    </Button>
                    <Button
                      onClick={() => handleExportData("analytics")}
                      variant="outline"
                      className="w-full justify-start bg-alabaster border-warm-gray/30"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Analytics Data
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Data Import</CardTitle>
                  <CardDescription className="text-warm-gray">
                    Import data from other systems or previous exports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-alabaster border-warm-gray/30">
                      <Upload className="h-4 w-4 mr-2" />
                      Import User Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-alabaster border-warm-gray/30">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Course Data
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-charcoal/10 border border-charcoal/20">
                    <p className="text-sm text-charcoal">
                      <strong>Note:</strong> Data imports should be in CSV format. Contact support for assistance with
                      large imports.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
