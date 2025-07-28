"use client"

import { useState, useEffect } from "react"
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
  Eye,
  ClipboardList,
} from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import Link from "next/link"

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

interface Assignment {
  _id: string;
  course: {
    _id: string;
    title: string;
  };
  assignee: {
    _id: string;
    name: string;
  };
  status: string;
  progress: number;
}

interface PlatformStats {
  totalCompanies: number
  activeCompanies: number
  totalUsers: number
  monthlyRevenue: number
  averageCompletion: number
  newSignups: number
}

export default function CompanyManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedIndustry, setSelectedIndustry] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const [contactMessage, setContactMessage] = useState("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch("/api/company")
        if (response.ok) {
          const data = await response.json()
          setCompanies(data)
        } else {
          console.error("Failed to fetch companies")
        }
      } catch (error) {
        console.error("Error fetching companies:", error)
      }
    }

    const fetchAssignments = async () => {
      try {
        const response = await fetch("/api/course-assignment")
        if (response.ok) {
          const data = await response.json()
          setAssignments(data)
        } else {
          console.error("Failed to fetch assignments")
        }
      } catch (error) {
        console.error("Error fetching assignments:", error)
      }
    }

    const fetchPlatformStats = async () => {
      try {
        const response = await fetch("/api/company/dashboard-metrics")
        if (response.ok) {
          const data = await response.json()
          setPlatformStats(data)
        } else {
          console.error("Failed to fetch platform stats")
        }
      } catch (error) {
        console.error("Error fetching platform stats:", error)
      }
    }

    fetchCompanies()
    fetchAssignments()
    fetchPlatformStats()
  }, [])

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

  const filteredCompanies = companies.filter((company) => {
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
              <div className="text-2xl font-bold text-charcoal">{platformStats?.totalCompanies}</div>
              <p className="text-xs text-success-green">+{platformStats?.newSignups} this month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Active Companies</CardTitle>
              <CheckCircle className="h-4 w-4 text-success-green" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{platformStats?.activeCompanies}</div>
              <p className="text-xs text-warm-gray">
                {platformStats && Math.round((platformStats.activeCompanies / platformStats.totalCompanies) * 100)}% active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">Total Users</CardTitle>
              <Users className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{platformStats?.totalUsers.toLocaleString()}</div>
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
                ${platformStats?.monthlyRevenue.toLocaleString()}
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
              <div className="text-2xl font-bold text-charcoal">{platformStats?.averageCompletion}%</div>
              <p className="text-xs text-success-green">+3% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-warm-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-warm-gray">New Signups</CardTitle>
              <Plus className="h-4 w-4 text-charcoal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-charcoal">{platformStats?.newSignups}</div>
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
                    <Link href={`/dashboard/course/try-out/60d5ec49f5a8a12a4c8a8a8a`} passHref>
                      <Button variant="outline" size="sm" className="bg-alabaster border-warm-gray/30">
                        <Eye className="h-4 w-4 mr-2" />
                        Try It
                      </Button>
                    </Link>
                    <Link href={`/dashboard/course/view/${company.id}`} passHref>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-alabaster border-warm-gray/30"
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        View Assignments
                      </Button>
                    </Link>
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
