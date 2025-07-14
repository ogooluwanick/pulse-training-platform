"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Employee {
  id: string
  name: string
  email: string
  role: string
  department: string
  overallProgress: number
  coursesAssigned: number
  coursesCompleted: number
  lastActivity: string
  status: "on-track" | "at-risk" | "overdue"
}

const mockEmployees: Employee[] = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@company.com",
    role: "Employee",
    department: "Engineering",
    overallProgress: 85,
    coursesAssigned: 4,
    coursesCompleted: 3,
    lastActivity: "2 hours ago",
    status: "on-track",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@company.com",
    role: "Employee",
    department: "Marketing",
    overallProgress: 45,
    coursesAssigned: 3,
    coursesCompleted: 1,
    lastActivity: "1 day ago",
    status: "at-risk",
  },
  {
    id: "3",
    name: "Mike Davis",
    email: "mike.davis@company.com",
    role: "Employee",
    department: "Sales",
    overallProgress: 25,
    coursesAssigned: 5,
    coursesCompleted: 1,
    lastActivity: "5 days ago",
    status: "overdue",
  },
]

const getStatusColor = (status: Employee["status"]) => {
  switch (status) {
    case "on-track":
      return "bg-success-green text-alabaster"
    case "at-risk":
      return "bg-warning-ochre text-alabaster"
    case "overdue":
      return "bg-red-500 text-alabaster"
    default:
      return "bg-warm-gray text-alabaster"
  }
}

export default function EmployeeManagementPage() {
  return (
    <div className="flex-1 space-y-6 p-6 min-h-screen" style={{ backgroundColor: "#f5f4ed" }}>
      <Card className="bg-card border-warm-gray/20">
        <CardHeader>
          <CardTitle className="text-charcoal">Employee Management</CardTitle>
          <CardDescription className="text-warm-gray">
            Manage your organization's employees and their progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockEmployees.map((employee) => (
              <div
                key={employee.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium text-charcoal">{employee.name}</p>
                    <p className="text-sm text-warm-gray">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Department</p>
                    <p className="text-sm text-charcoal">{employee.department}</p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress value={employee.overallProgress} className="flex-1 h-2" />
                      <span className="text-sm text-charcoal">{employee.overallProgress}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Status</p>
                    <Badge className={getStatusColor(employee.status)} variant="secondary">
                      {employee.status === "on-track" && "On Track"}
                      {employee.status === "at-risk" && "At Risk"}
                      {employee.status === "overdue" && "Overdue"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent border-warm-gray/30">
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
