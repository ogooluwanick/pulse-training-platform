"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { UserPlus, Mail, Search, Edit, Trash2, BookOpen } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"


interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  joinDate: string
  lastActivity: string
  coursesAssigned: number
  coursesCompleted: number
  overallProgress: number
  averageScore: number
  status: "active" | "inactive" | "pending"
  manager?: string
}

interface Department {
  name: string
  employees: number
  manager: string
  completionRate: number
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    department: "Engineering",
    role: "Senior Developer",
    joinDate: "2023-01-15",
    lastActivity: "2 hours ago",
    coursesAssigned: 5,
    coursesCompleted: 4,
    overallProgress: 85,
    averageScore: 92,
    status: "active",
    manager: "Sarah Johnson",
  },
  {
    id: "2",
    name: "Emily Davis",
    email: "emily.davis@company.com",
    department: "Marketing",
    role: "Marketing Specialist",
    joinDate: "2023-03-22",
    lastActivity: "1 day ago",
    coursesAssigned: 4,
    coursesCompleted: 2,
    overallProgress: 45,
    averageScore: 78,
    status: "active",
    manager: "Mike Wilson",
  },
  {
    id: "3",
    name: "Robert Chen",
    email: "robert.chen@company.com",
    department: "Sales",
    role: "Account Executive",
    joinDate: "2023-06-10",
    lastActivity: "3 days ago",
    coursesAssigned: 6,
    coursesCompleted: 1,
    overallProgress: 25,
    averageScore: 65,
    status: "active",
    manager: "Lisa Rodriguez",
  },
  {
    id: "4",
    name: "Maria Garcia",
    email: "maria.garcia@company.com",
    department: "HR",
    role: "HR Coordinator",
    joinDate: "2023-02-08",
    lastActivity: "5 hours ago",
    coursesAssigned: 3,
    coursesCompleted: 3,
    overallProgress: 100,
    averageScore: 95,
    status: "active",
    manager: "David Kim",
  },
]

const mockDepartments: Department[] = [
  { name: "Engineering", employees: 45, manager: "Sarah Johnson", completionRate: 92 },
  { name: "Marketing", employees: 28, manager: "Mike Wilson", completionRate: 78 },
  { name: "Sales", employees: 35, manager: "Lisa Rodriguez", completionRate: 65 },
  { name: "HR", employees: 12, manager: "David Kim", completionRate: 95 },
  { name: "Finance", employees: 18, manager: "Jennifer Lee", completionRate: 88 },
]

export default function TeamManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("all")
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [inviteEmails, setInviteEmails] = useState("")
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    department: "",
    role: "",
    manager: "",
  })

  const getStatusColor = (status: Employee["status"]) => {
    switch (status) {
      case "active":
        return "bg-success-green text-alabaster"
      case "inactive":
        return "bg-warm-gray text-alabaster"
      case "pending":
        return "bg-warning-ochre text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "text-success-green"
    if (progress >= 60) return "text-warning-ochre"
    return "text-red-500"
  }

  const handleInviteEmployees = () => {
    console.log("Inviting employees:", inviteEmails)
    setIsInviteDialogOpen(false)
    setInviteEmails("")
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setEditForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      role: employee.role,
      manager: employee.manager || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEmployee = () => {
    console.log("Saving employee:", editForm)
    setIsEditDialogOpen(false)
    setSelectedEmployee(null)
  }

  const handleAssignCourses = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsAssignDialogOpen(true)
  }

  const handleDeleteEmployee = (employee: Employee) => {
    console.log("Deleting employee:", employee.name)
  }

  const filteredEmployees = mockEmployees.filter((employee) => {
    const matchesSearch =
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = selectedDepartment === "all" || employee.department === selectedDepartment
    return matchesSearch && matchesDepartment
  })

  return (
    <AuthGuard allowedRoles={["COMPANY", "ADMIN"]}>
      <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Team Management</h1>
            <p className="text-warm-gray">Manage employees, departments, and learning assignments</p>
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Employees
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-charcoal">Invite New Employees</DialogTitle>
                <DialogDescription className="text-warm-gray">
                  Send invitations to new team members to join your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emails" className="text-charcoal">
                    Email Addresses
                  </Label>
                  <Textarea
                    id="emails"
                    placeholder="Enter email addresses, one per line or separated by commas"
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleInviteEmployees} className="btn-primary">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitations
                  </Button>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="bg-alabaster">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Department Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {mockDepartments.map((dept) => (
            <Card key={dept.name} className="bg-card border-warm-gray/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-warm-gray">{dept.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-charcoal">{dept.employees}</div>
                <p className="text-xs text-warm-gray mb-2">employees</p>
                <div className="flex items-center gap-2">
                  <Progress value={dept.completionRate} className="flex-1 h-2" />
                  <span className="text-xs text-charcoal">{dept.completionRate}%</span>
                </div>
                <p className="text-xs text-warm-gray mt-1">Manager: {dept.manager}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Team Management Tabs */}
        <Tabs defaultValue="employees" className="space-y-6">
          <TabsList className="bg-parchment border border-warm-gray/20">
            <TabsTrigger value="employees" className="data-[state=active]:bg-alabaster">
              Employee Directory
            </TabsTrigger>
            <TabsTrigger value="departments" className="data-[state=active]:bg-alabaster">
              Department Management
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-alabaster">
              Course Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-charcoal">Employee Directory</CardTitle>
                    <CardDescription className="text-warm-gray">
                      Manage all employees and their learning progress
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
                      />
                    </div>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger className="w-40 bg-alabaster border-warm-gray/30">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent className="bg-parchment border-warm-gray/20">
                        <SelectItem value="all">All Departments</SelectItem>
                        {mockDepartments.map((dept) => (
                          <SelectItem key={dept.name} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                    >
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div>
                          <p className="font-medium text-charcoal">{employee.name}</p>
                          <p className="text-sm text-warm-gray">{employee.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Department</p>
                          <p className="text-sm text-charcoal">{employee.department}</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Role</p>
                          <p className="text-sm text-charcoal">{employee.role}</p>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Progress</p>
                          <div className="flex items-center gap-2">
                            <Progress value={employee.overallProgress} className="flex-1 h-2" />
                            <span className={`text-sm ${getProgressColor(employee.overallProgress)}`}>
                              {employee.overallProgress}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Status</p>
                          <Badge className={getStatusColor(employee.status)} variant="secondary">
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-warm-gray">Last Activity</p>
                          <p className="text-sm text-charcoal">{employee.lastActivity}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-alabaster border-warm-gray/30"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-alabaster border-warm-gray/30"
                          onClick={() => handleAssignCourses(employee)}
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-alabaster border-red-500 text-red-500 hover:bg-red-500 hover:text-alabaster"
                          onClick={() => handleDeleteEmployee(employee)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-6">
            <Card className="bg-card border-warm-gray/20">
              <CardHeader>
                <CardTitle className="text-charcoal">Bulk Course Assignments</CardTitle>
                <CardDescription className="text-warm-gray">
                  Assign courses to multiple employees or departments at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="bg-alabaster border-warm-gray/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-charcoal">Assign by Department</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select>
                        <SelectTrigger className="bg-parchment border-warm-gray/30">
                          <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          {mockDepartments.map((dept) => (
                            <SelectItem key={dept.name} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="bg-parchment border-warm-gray/30">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="gdpr">Data Privacy & GDPR</SelectItem>
                          <SelectItem value="cyber">Cybersecurity Awareness</SelectItem>
                          <SelectItem value="aml">Anti-Money Laundering</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="w-full btn-primary">Assign to Department</Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-alabaster border-warm-gray/20">
                    <CardHeader>
                      <CardTitle className="text-lg text-charcoal">Assign by Role</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Select>
                        <SelectTrigger className="bg-parchment border-warm-gray/30">
                          <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="senior">Senior Level</SelectItem>
                          <SelectItem value="junior">Junior Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select>
                        <SelectTrigger className="bg-parchment border-warm-gray/30">
                          <SelectValue placeholder="Select Course" />
                        </SelectTrigger>
                        <SelectContent className="bg-parchment border-warm-gray/20">
                          <SelectItem value="leadership">Leadership Training</SelectItem>
                          <SelectItem value="compliance">Compliance Basics</SelectItem>
                          <SelectItem value="onboarding">New Employee Onboarding</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="w-full btn-primary">Assign by Role</Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Employee Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-charcoal">Edit Employee</DialogTitle>
              <DialogDescription className="text-warm-gray">Update employee information and settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-charcoal">
                    Name
                  </Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email" className="text-charcoal">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-department" className="text-charcoal">
                    Department
                  </Label>
                  <Select
                    value={editForm.department}
                    onValueChange={(value) => setEditForm({ ...editForm, department: value })}
                  >
                    <SelectTrigger className="bg-alabaster border-warm-gray/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-parchment border-warm-gray/20">
                      {mockDepartments.map((dept) => (
                        <SelectItem key={dept.name} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-role" className="text-charcoal">
                    Role
                  </Label>
                  <Input
                    id="edit-role"
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEmployee} className="btn-primary">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="bg-alabaster">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign Courses Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-charcoal">Assign Courses</DialogTitle>
              <DialogDescription className="text-warm-gray">
                Assign training courses to {selectedEmployee?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { id: "gdpr", name: "Data Privacy & GDPR Compliance", assigned: true },
                  { id: "cyber", name: "Cybersecurity Awareness", assigned: false },
                  { id: "aml", name: "Anti-Money Laundering (AML)", assigned: true },
                  { id: "leadership", name: "Leadership Training", assigned: false },
                ].map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-alabaster">
                    <div>
                      <p className="text-sm font-medium text-charcoal">{course.name}</p>
                    </div>
                    <Badge
                      className={course.assigned ? "bg-success-green text-alabaster" : "bg-warm-gray text-alabaster"}
                    >
                      {course.assigned ? "Assigned" : "Not Assigned"}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button className="btn-primary">Update Assignments</Button>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} className="bg-alabaster">
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
