"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Building2,
  Users,
  TrendingUp,
  Search,
  Edit,
  Trash2,
  Plus,
  Mail,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

interface Company {
  id: string
  name: string
  domain: string
  industry: string
  size: string
  plan: string
  status: "active" | "inactive" | "trial" | "suspended"
  employees: number
  activeUsers: number
  completionRate: number
  joinDate: string
  lastActivity: string
  monthlyRevenue: number
  contactEmail: string
  contactName: string
}

interface PlatformStats {
  totalCompanies: number
  activeCompanies: number
  totalUsers: number
  monthlyRevenue: number
  averageCompletion: number
  newSignups: number
}

const mockCompanies: Company[] = [
  {
    id: "1",
    name: "TechCorp Solutions",
    domain: "techcorp.com",
    industry: "Technology",
    size: "100-500",
    plan: "Enterprise",
    status: "active",
    employees: 150,
    activeUsers: 142,
    completionRate: 87,
    joinDate: "2023-01-15",
    lastActivity: "2 hours ago",
    monthlyRevenue: 2499,
    contactEmail: "admin@techcorp.com",
    contactName: "Sarah Johnson",
  },
  {
    id: "2",
    name: "Global Finance Inc",
    domain: "globalfinance.com",
    industry: "Finance",
    size: "500+",
    plan: "Enterprise Plus",
    status: "active",
    employees: 750,
    activeUsers: 698,
    completionRate: 92,
    joinDate: "2022-11-08",
    lastActivity: "1 hour ago",
    monthlyRevenue: 4999,
    contactEmail: "training@globalfinance.com",
    contactName: "Michael Chen",
  },
  {
    id: "3",
    name: "HealthCare Partners",
    domain: "healthcarepartners.com",
    industry: "Healthcare",
    size: "51-100",
    plan: "Professional",
    status: "trial",
    employees: 85,
    activeUsers: 45,
    completionRate: 65,
    joinDate: "2024-01-10",
    lastActivity: "1 day ago",
    monthlyRevenue: 0,
    contactEmail: "hr@healthcarepartners.com",
    contactName: "Lisa Rodriguez",
  },
  {
    id: "4",
    name: "Manufacturing Co",
    domain: "manufacturingco.com",
    industry: "Manufacturing",
    size: "100-500",
    plan: "Enterprise",
    status: "suspended",
    employees: 200,
    activeUsers: 0,
    completionRate: 45,
    joinDate: "2023-06-22",
    lastActivity: "2 weeks ago",
    monthlyRevenue: 2499,
    contactEmail: "admin@manufacturingco.com",
    contactName: "David Kim",
  },
]

const mockPlatformStats: PlatformStats = {
  totalCompanies: 47,
  activeCompanies: 42,
  totalUsers: 3250,
  monthlyRevenue: 125000,
  averageCompletion: 84,
  newSignups: 8,
}

export default function CompanyManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState("")

  const getStatusColor = (status: Company["status"]) => {
    switch (status) {
      case "active":
        return "bg-success-green text-alabaster"
      case "trial":
        return "bg-warning-ochre text-alabaster"
      case "suspended":
        return "bg-red-500 text-alabaster"
      case "inactive":
        return "bg-warm-gray text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "Enterprise Plus":
        return "bg-charcoal text-alabaster"
      case "Enterprise":
        return "bg-success-green text-alabaster"
      case "Professional":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company)
    setIsEditDialogOpen(true)
  }

  const handleContactCompany = (company: Company) => {
    setSelectedCompany(company)
    setIsContactDialogOpen(true)
  }

  const handleSuspendCompany = (company: Company) => {
    console.log("Suspending company:", company.name)
  }

  const handleDeleteCompany = (company: Company) => {
    console.log("Deleting company:", company.name)
  }

  const handleSendMessage = () => {
    console.log("Sending message to:", selectedCompany?.name, contactMessage)
    setIsContactDialogOpen(false)
    setContactMessage("")
  }

  const filteredCompanies = mockCompanies.filter((company) => {
    const matchesSearch =
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.domain.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = selectedIndustry === "all" || company.industry === selectedIndustry
    const matchesStatus = selectedStatus === "all" || company.status === selectedStatus
    return matchesSearch && matchesIndustry && matchesStatus
  })

  return (
    <AuthGuard allowedRoles={["ADMIN"]}>
      <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Company Management</h1>
            <p className="text-warm-gray">Manage all organizations on the platform</p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Platform Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Total Companies</CardTitle>
              <Building2 className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockPlatformStats.totalCompanies}</div>
              <p className="text-xs text-success-green">+{mockPlatformStats.newSignups} this month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Active Companies</CardTitle>
              <CheckCircle className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockPlatformStats.activeCompanies}</div>
              <p className="text-xs text-warm-gray">
                {Math.round((mockPlatformStats.activeCompanies / mockPlatformStats.totalCompanies) * 100)}% active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Total Users</CardTitle>
              <Users className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockPlatformStats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-success-green">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">
                ${mockPlatformStats.monthlyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-success-green">+8% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Avg Completion</CardTitle>
              <TrendingUp className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockPlatformStats.averageCompletion}%</div>
              <p className="text-xs text-success-green">+3% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">New Signups</CardTitle>
              <Plus className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{mockPlatformStats.newSignups}</div>
              <p className="text-xs text-warm-gray">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Company Management */}
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-charcoal">Company Directory</CardTitle>
                <CardDescription className="text-warm-gray">
                  Manage all organizations and their subscriptions
                </CardDescription>
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
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-32 bg-alabaster border-warm-gray/30">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-parchment border-warm-gray/20">
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32 bg-alabaster border-warm-gray/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-parchment border-warm-gray/20">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div>
                      <p className="font-medium text-charcoal">{company.name}</p>
                      <p className="text-sm text-warm-gray">{company.domain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Industry</p>
                      <p className="text-sm text-charcoal">{company.industry}</p>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Plan</p>
                      <Badge className={getPlanColor(company.plan)} variant="secondary">
                        {company.plan}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Users</p>
                      <p className="text-sm text-charcoal">
                        {company.activeUsers}/{company.employees}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Completion</p>
                      <div className="flex items-center gap-2">
                        <Progress value={company.completionRate} className="flex-1 h-2" />
                        <span className="text-sm text-charcoal">{company.completionRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Revenue</p>
                      <p className="text-sm text-charcoal">${company.monthlyRevenue}/mo</p>
                    </div>
                    <div>
                      <p className="text-sm text-warm-gray">Status</p>
                      <Badge className={getStatusColor(company.status)} variant="secondary">
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-alabaster border-warm-gray/30"
                      onClick={() => handleEditCompany(company)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-alabaster border-warm-gray/30"
                      onClick={() => handleContactCompany(company)}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    {company.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-alabaster border-warning-ochre text-warning-ochre hover:bg-warning-ochre hover:text-alabaster"
                        onClick={() => handleSuspendCompany(company)}
                      >
                        <AlertTriangle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-alabaster border-red-500 text-red-500 hover:bg-red-500 hover:text-alabaster"
                        onClick={() => handleDeleteCompany(company)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Company Dialog */}
        <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
          <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-charcoal">Contact Company</DialogTitle>
              <DialogDescription className="text-warm-gray">
                Send a message to {selectedCompany?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact-message" className="text-charcoal">
                  Message
                </Label>
                <Textarea
                  id="contact-message"
                  placeholder="Enter your message..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSendMessage} className="btn-primary">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" onClick={() => setIsContactDialogOpen(false)} className="bg-alabaster">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
