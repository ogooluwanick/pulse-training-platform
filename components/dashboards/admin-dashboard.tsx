"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Building2, Users, TrendingUp, AlertTriangle, Search, Pause, Play, Trash2, Eye } from "lucide-react"
import type { User } from "@/lib/auth"

interface AdminDashboardProps {
  user: User
}

interface Company {
  id: string
  name: string
  domain: string
  totalUsers: number
  activeUsers: number
  overallCompliance: number
  subscriptionPlan: string
  status: "active" | "suspended" | "trial"
  createdAt: string
  lastActivity: string
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp Solutions",
    domain: "techcorp.com",
    totalUsers: 150,
    activeUsers: 142,
    overallCompliance: 87,
    subscriptionPlan: "Enterprise",
    status: "active",
    createdAt: "2023-06-15",
    lastActivity: "2 hours ago",
  },
  {
    id: "2",
    name: "Global Finance Ltd",
    domain: "globalfinance.com",
    totalUsers: 89,
    activeUsers: 76,
    overallCompliance: 92,
    subscriptionPlan: "Professional",
    status: "active",
    createdAt: "2023-08-22",
    lastActivity: "1 day ago",
  },
  {
    id: "3",
    name: "StartupXYZ",
    domain: "startupxyz.com",
    totalUsers: 25,
    activeUsers: 18,
    overallCompliance: 45,
    subscriptionPlan: "Starter",
    status: "trial",
    createdAt: "2024-01-10",
    lastActivity: "3 days ago",
  },
  {
    id: "4",
    name: "MegaCorp Industries",
    domain: "megacorp.com",
    totalUsers: 500,
    activeUsers: 0,
    overallCompliance: 0,
    subscriptionPlan: "Enterprise",
    status: "suspended",
    createdAt: "2023-03-08",
    lastActivity: "2 weeks ago",
  },
]

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  const totalActiveCompanies = mockCompanies.filter((c) => c.status === "active").length
  const totalActiveUsers = mockCompanies.reduce((acc, company) => acc + company.activeUsers, 0)
  const platformWideCompletion = Math.round(
    mockCompanies.reduce((acc, company) => acc + company.overallCompliance, 0) / mockCompanies.length,
  )

  const getStatusColor = (status: Company["status"]) => {
    switch (status) {
      case "active":
        return "bg-success-green text-alabaster"
      case "trial":
        return "bg-charcoal text-alabaster"
      case "suspended":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const handleCompanyAction = (company: Company, action: "suspend" | "reactivate" | "delete") => {
    console.log(`${action} company:`, company.name)
    // Handle company actions
  }

  const filteredCompanies = mockCompanies.filter(
    (company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.domain.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Platform Administration</h1>
            <p className="text-warm-gray">Manage all client organizations and platform metrics</p>
          </div>
        </div>
      </div>

      {/* Platform Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Active Companies</CardTitle>
            <Building2 className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{totalActiveCompanies}</div>
            <p className="text-xs text-warm-gray">+2 this month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Total Active Users</CardTitle>
            <Users className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{totalActiveUsers.toLocaleString()}</div>
            <p className="text-xs text-warm-gray">Across all organizations</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Platform Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">{platformWideCompletion}%</div>
            <p className="text-xs text-warm-gray">Average across all companies</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">Companies at Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning-ochre" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {mockCompanies.filter((c) => c.overallCompliance < 70).length}
            </div>
            <p className="text-xs text-warm-gray">Below 70% compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Company Management */}
      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger value="companies" className="data-[state=active]:bg-alabaster">
            Company Management
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-alabaster">
            Platform Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-alabaster">
            Platform Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-charcoal">Client Organizations</CardTitle>
                  <CardDescription className="text-warm-gray">Manage all registered client companies</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                    <Input
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <p className="font-medium text-charcoal">{company.name}</p>
                        <p className="text-sm text-warm-gray">{company.domain}</p>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Users</p>
                        <p className="text-sm text-charcoal">
                          {company.activeUsers} / {company.totalUsers}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Compliance</p>
                        <p className="text-sm text-charcoal">{company.overallCompliance}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Plan</p>
                        <p className="text-sm text-charcoal">{company.subscriptionPlan}</p>
                      </div>
                      <div>
                        <p className="text-sm text-warm-gray">Status</p>
                        <Badge className={getStatusColor(company.status)} variant="secondary">
                          {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-warm-gray/30"
                            onClick={() => setSelectedCompany(company)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-parchment border-warm-gray/20 max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-charcoal">{company.name} - Details</DialogTitle>
                            <DialogDescription className="text-warm-gray">
                              Detailed information and management options
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium text-charcoal">Domain</p>
                                <p className="text-sm text-warm-gray">{company.domain}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-charcoal">Created</p>
                                <p className="text-sm text-warm-gray">{company.createdAt}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-charcoal">Last Activity</p>
                                <p className="text-sm text-warm-gray">{company.lastActivity}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-charcoal">Subscription</p>
                                <p className="text-sm text-warm-gray">{company.subscriptionPlan}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-4 border-t border-warm-gray/20">
                              {company.status === "active" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent border-warning-ochre text-warning-ochre hover:bg-warning-ochre hover:text-alabaster"
                                  onClick={() => handleCompanyAction(company, "suspend")}
                                >
                                  <Pause className="h-4 w-4 mr-2" />
                                  Suspend
                                </Button>
                              ) : company.status === "suspended" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-transparent border-success-green text-success-green hover:bg-success-green hover:text-alabaster"
                                  onClick={() => handleCompanyAction(company, "reactivate")}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Reactivate
                                </Button>
                              ) : null}
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-transparent border-red-500 text-red-500 hover:bg-red-500 hover:text-alabaster"
                                onClick={() => handleCompanyAction(company, "delete")}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Revenue by Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Enterprise</span>
                    <span className="text-sm font-medium text-charcoal">$45,000/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Professional</span>
                    <span className="text-sm font-medium text-charcoal">$12,500/mo</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Starter</span>
                    <span className="text-sm font-medium text-charcoal">$2,400/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">New Companies (30d)</span>
                    <span className="text-sm font-medium text-charcoal">+8</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">New Users (30d)</span>
                    <span className="text-sm font-medium text-charcoal">+247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-warm-gray">Churn Rate</span>
                    <span className="text-sm font-medium text-charcoal">2.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
