"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Settings,
  Database,
  Mail,
  Shield,
  Server,
  AlertTriangle,
  CheckCircle,
  Upload,
  Download,
  Zap,
  Users,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

interface PlatformSettings {
  siteName: string
  siteUrl: string
  supportEmail: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
  maxFileSize: number
  sessionTimeout: number
  backupFrequency: string
  logLevel: string
}

interface SystemHealth {
  status: "healthy" | "warning" | "critical"
  uptime: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  activeConnections: number
  lastBackup: string
}

interface EmailSettings {
  provider: string
  smtpHost: string
  smtpPort: number
  smtpUser: string
  fromEmail: string
  fromName: string
  enabled: boolean
}

const mockPlatformSettings: PlatformSettings = {
  siteName: "Pulse Training Platform",
  siteUrl: "https://pulse-training.com",
  supportEmail: "support@pulse-training.com",
  maintenanceMode: false,
  registrationEnabled: true,
  emailVerificationRequired: true,
  maxFileSize: 50,
  sessionTimeout: 480,
  backupFrequency: "daily",
  logLevel: "info",
}

const mockSystemHealth: SystemHealth = {
  status: "healthy",
  uptime: "15 days, 8 hours",
  cpuUsage: 35,
  memoryUsage: 68,
  diskUsage: 42,
  activeConnections: 1247,
  lastBackup: "2024-01-15 03:00:00",
}

const mockEmailSettings: EmailSettings = {
  provider: "smtp",
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpUser: "noreply@pulse-training.com",
  fromEmail: "noreply@pulse-training.com",
  fromName: "Pulse Training Platform",
  enabled: true,
}

export default function PlatformSettingsPage() {
  const [platformSettings, setPlatformSettings] = useState(mockPlatformSettings)
  const [emailSettings, setEmailSettings] = useState(mockEmailSettings)
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false)
  const [maintenanceMessage, setMaintenanceMessage] = useState("")

  const getHealthColor = (status: SystemHealth["status"]) => {
    switch (status) {
      case "healthy":
        return "text-success-green"
      case "warning":
        return "text-warning-ochre"
      case "critical":
        return "text-red-500"
      default:
        return "text-warm-gray"
    }
  }

  const getHealthIcon = (status: SystemHealth["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-success-green" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-warning-ochre" />
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-warm-gray" />
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage >= 80) return "text-red-500"
    if (usage >= 60) return "text-warning-ochre"
    return "text-success-green"
  }

  const handleSavePlatformSettings = () => {
    console.log("Saving platform settings:", platformSettings)
  }

  const handleSaveEmailSettings = () => {
    console.log("Saving email settings:", emailSettings)
  }

  const handleMaintenanceMode = () => {
    console.log("Enabling maintenance mode:", maintenanceMessage)
    setIsMaintenanceDialogOpen(false)
    setMaintenanceMessage("")
  }

  const handleBackupNow = () => {
    console.log("Starting manual backup")
    setIsBackupDialogOpen(false)
  }

  const handleTestEmail = () => {
    console.log("Sending test email")
  }

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Platform Settings</h1>
            <p className="text-warm-gray">Configure system-wide settings and monitor platform health</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isMaintenanceDialogOpen} onOpenChange={setIsMaintenanceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-alabaster border-warm-gray/30">
                  <Settings className="h-4 w-4 mr-2" />
                  Maintenance Mode
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
                <DialogHeader>
                  <DialogTitle className="text-charcoal">Enable Maintenance Mode</DialogTitle>
                  <DialogDescription className="text-warm-gray">
                    This will temporarily disable access to the platform for all users
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="maintenance-message" className="text-charcoal">
                      Maintenance Message
                    </Label>
                    <Textarea
                      id="maintenance-message"
                      placeholder="We're performing scheduled maintenance. Please check back soon."
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleMaintenanceMode}
                      className="bg-warning-ochre text-alabaster hover:bg-warning-ochre/90"
                    >
                      Enable Maintenance Mode
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsMaintenanceDialogOpen(false)}
                      className="bg-alabaster"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleSavePlatformSettings} className="btn-primary">
              Save Settings
            </Button>
          </div>
        </div>

        {/* System Health Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">System Status</CardTitle>
              {getHealthIcon(mockSystemHealth.status)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getHealthColor(mockSystemHealth.status)}`}>
                {mockSystemHealth.status.charAt(0).toUpperCase() + mockSystemHealth.status.slice(1)}
              </div>
              <p className="text-xs text-warm-gray">Uptime: {mockSystemHealth.uptime}</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">CPU Usage</CardTitle>
              <Zap className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUsageColor(mockSystemHealth.cpuUsage)}`}>
                {mockSystemHealth.cpuUsage}%
              </div>
              <p className="text-xs text-warm-gray">Current load</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Memory Usage</CardTitle>
              <Database className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUsageColor(mockSystemHealth.memoryUsage)}`}>
                {mockSystemHealth.memoryUsage}%
              </div>
              <p className="text-xs text-warm-gray">RAM utilization</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Disk Usage</CardTitle>
              <Server className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getUsageColor(mockSystemHealth.diskUsage)}`}>
                {mockSystemHealth.diskUsage}%
              </div>
              <p className="text-xs text-warm-gray">Storage used</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Active Users</CardTitle>
              <Users className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockSystemHealth.activeConnections}</div>
              <p className="text-xs text-warm-gray">Connected now</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Last Backup</CardTitle>
              <Database className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold text-charcoal">Success</div>
              <p className="text-xs text-warm-gray">{mockSystemHealth.lastBackup}</p>
            </CardContent>
          </Card>
        </div>

        {/* Platform Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-parchment border border-warm-gray/20">
            <TabsTrigger value="general" className="data-[state=active]:bg-alabaster">
              General Settings
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-alabaster">
              Security & Access
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-alabaster">
              Email Configuration
            </TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-alabaster">
              Backup & Maintenance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Site Configuration</CardTitle>
                  <CardDescription className="text-warm-gray">Basic platform settings and branding</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="site-name" className="text-charcoal">
                      Site Name
                    </Label>
                    <Input
                      id="site-name"
                      value={platformSettings.siteName}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, siteName: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="site-url" className="text-charcoal">
                      Site URL
                    </Label>
                    <Input
                      id="site-url"
                      value={platformSettings.siteUrl}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, siteUrl: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="support-email" className="text-charcoal">
                      Support Email
                    </Label>
                    <Input
                      id="support-email"
                      type="email"
                      value={platformSettings.supportEmail}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-file-size" className="text-charcoal">
                      Max File Size (MB)
                    </Label>
                    <Input
                      id="max-file-size"
                      type="number"
                      value={platformSettings.maxFileSize}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, maxFileSize: Number.parseInt(e.target.value) })
                      }
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">System Preferences</CardTitle>
                  <CardDescription className="text-warm-gray">Platform behavior and logging settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Maintenance Mode</p>
                      <p className="text-xs text-warm-gray">Disable platform access for maintenance</p>
                    </div>
                    <Switch
                      checked={platformSettings.maintenanceMode}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({ ...platformSettings, maintenanceMode: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-charcoal">User Registration</p>
                      <p className="text-xs text-warm-gray">Allow new user registrations</p>
                    </div>
                    <Switch
                      checked={platformSettings.registrationEnabled}
                      onCheckedChange={(checked) =>
                        setPlatformSettings({ ...platformSettings, registrationEnabled: checked })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="session-timeout" className="text-charcoal">
                      Session Timeout (minutes)
                    </Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={platformSettings.sessionTimeout}
                      onChange={(e) =>
                        setPlatformSettings({ ...platformSettings, sessionTimeout: Number.parseInt(e.target.value) })
                      }
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div>
                    <Label htmlFor="log-level" className="text-charcoal">
                      Log Level
                    </Label>
                    <Select
                      value={platformSettings.logLevel}
                      onValueChange={(value) => setPlatformSettings({ ...platformSettings, logLevel: value })}
                    >
                      <SelectTrigger className="bg-alabaster border-warm-gray/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-parchment border-warm-gray/20">
                        <SelectItem value="debug">Debug</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Security Settings</CardTitle>
                <CardDescription className="text-warm-gray">Configure platform-wide security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-charcoal">Email Verification Required</p>
                    <p className="text-xs text-warm-gray">Require email verification for new accounts</p>
                  </div>
                  <Switch
                    checked={platformSettings.emailVerificationRequired}
                    onCheckedChange={(checked) =>
                      setPlatformSettings({ ...platformSettings, emailVerificationRequired: checked })
                    }
                  />
                </div>
                <div className="p-4 rounded-lg bg-warning-ochre/10 border border-warning-ochre/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-warning-ochre mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-charcoal">Security Recommendations</p>
                      <ul className="text-xs text-warm-gray mt-1 space-y-1">
                        <li>• Enable two-factor authentication for admin accounts</li>
                        <li>• Regularly update system dependencies</li>
                        <li>• Monitor failed login attempts</li>
                        <li>• Use strong password policies</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">SMTP Configuration</CardTitle>
                  <CardDescription className="text-warm-gray">Configure email delivery settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-charcoal">Email Service Enabled</p>
                      <p className="text-xs text-warm-gray">Enable/disable email functionality</p>
                    </div>
                    <Switch
                      checked={emailSettings.enabled}
                      onCheckedChange={(checked) => setEmailSettings({ ...emailSettings, enabled: checked })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-host" className="text-charcoal">
                        SMTP Host
                      </Label>
                      <Input
                        id="smtp-host"
                        value={emailSettings.smtpHost}
                        onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                        className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-port" className="text-charcoal">
                        SMTP Port
                      </Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={emailSettings.smtpPort}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, smtpPort: Number.parseInt(e.target.value) })
                        }
                        className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="smtp-user" className="text-charcoal">
                      SMTP Username
                    </Label>
                    <Input
                      id="smtp-user"
                      value={emailSettings.smtpUser}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                      className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="from-email" className="text-charcoal">
                        From Email
                      </Label>
                      <Input
                        id="from-email"
                        type="email"
                        value={emailSettings.fromEmail}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                        className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                    <div>
                      <Label htmlFor="from-name" className="text-charcoal">
                        From Name
                      </Label>
                      <Input
                        id="from-name"
                        value={emailSettings.fromName}
                        onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                        className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Email Testing</CardTitle>
                  <CardDescription className="text-warm-gray">Test your email configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-alabaster border border-warm-gray/20">
                    <p className="text-sm text-charcoal mb-2">Current Configuration:</p>
                    <div className="space-y-1 text-xs text-warm-gray">
                      <p>Host: {emailSettings.smtpHost}</p>
                      <p>Port: {emailSettings.smtpPort}</p>
                      <p>From: {emailSettings.fromEmail}</p>
                      <p>Status: {emailSettings.enabled ? "Enabled" : "Disabled"}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button onClick={handleTestEmail} className="w-full btn-primary">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Test Email
                    </Button>
                    <Button onClick={handleSaveEmailSettings} variant="outline" className="w-full bg-alabaster">
                      Save Email Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">Backup Configuration</CardTitle>
                  <CardDescription className="text-warm-gray">Automated backup settings and schedules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="backup-frequency" className="text-charcoal">
                      Backup Frequency
                    </Label>
                    <Select
                      value={platformSettings.backupFrequency}
                      onValueChange={(value) => setPlatformSettings({ ...platformSettings, backupFrequency: value })}
                    >
                      <SelectTrigger className="bg-alabaster border-warm-gray/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-parchment border-warm-gray/20">
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-4 rounded-lg bg-success-green/10 border border-success-green/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success-green mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">Last Backup Status</p>
                        <p className="text-xs text-warm-gray">
                          Completed successfully on {mockSystemHealth.lastBackup}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full btn-primary">
                        <Database className="h-4 w-4 mr-2" />
                        Start Manual Backup
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
                      <DialogHeader>
                        <DialogTitle className="text-charcoal">Manual Backup</DialogTitle>
                        <DialogDescription className="text-warm-gray">
                          This will create a full backup of all platform data
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-charcoal/10 border border-charcoal/20">
                          <p className="text-sm text-charcoal">
                            <strong>Warning:</strong> Manual backups may take several minutes to complete and could
                            impact system performance.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleBackupNow} className="btn-primary">
                            Start Backup
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsBackupDialogOpen(false)}
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

              <Card className="bg-card border-warm-gray/20">
                <CardHeader>
                  <CardTitle className="text-charcoal">System Maintenance</CardTitle>
                  <CardDescription className="text-warm-gray">Platform maintenance and cleanup tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-alabaster border-warm-gray/30">
                      <Download className="h-4 w-4 mr-2" />
                      Download System Logs
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-alabaster border-warm-gray/30">
                      <Database className="h-4 w-4 mr-2" />
                      Clean Temporary Files
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-alabaster border-warm-gray/30">
                      <Upload className="h-4 w-4 mr-2" />
                      Update System Dependencies
                    </Button>
                  </div>
                  <div className="p-4 rounded-lg bg-warning-ochre/10 border border-warning-ochre/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning-ochre mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-charcoal">Maintenance Schedule</p>
                        <p className="text-xs text-warm-gray">Next scheduled maintenance: Sunday 2:00 AM UTC</p>
                      </div>
                    </div>
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
