"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Assignment {
  id: string
  courseName: string
  assignee: string
  status: string
  dueDate: string
}

// Mock data for now, will be replaced with API call
const mockAssignments: Assignment[] = [
  {
    id: "1",
    courseName: "Advanced React",
    assignee: "John Doe",
    status: "In Progress",
    dueDate: "2024-08-15",
  },
  {
    id: "2",
    courseName: "Next.js Fundamentals",
    assignee: "Jane Smith",
    status: "Completed",
    dueDate: "2024-07-30",
  },
  {
    id: "3",
    courseName: "TypeScript for Beginners",
    assignee: "Peter Jones",
    status: "Not Started",
    dueDate: "2024-09-01",
  },
  {
    id: "4",
    courseName: "GraphQL Mastery",
    assignee: "Mary Johnson",
    status: "In Progress",
    dueDate: "2024-08-20",
  },
]

export default function CourseAssignmentDashboard() {
  const [assignments, setAssignments] = useState(mockAssignments)
  const [filteredAssignments, setFilteredAssignments] = useState(assignments)
  const [filter, setFilter] = useState("")
  const [sort, setSort] = useState({ key: "courseName", order: "asc" })

  useEffect(() => {
    let filtered = assignments.filter(
      assignment =>
        assignment.courseName.toLowerCase().includes(filter.toLowerCase()) ||
        assignment.assignee.toLowerCase().includes(filter.toLowerCase())
    )

    let sorted = [...filtered].sort((a, b) => {
      const aValue = a[sort.key as keyof Assignment]
      const bValue = b[sort.key as keyof Assignment]

      if (aValue < bValue) {
        return sort.order === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sort.order === "asc" ? 1 : -1
      }
      return 0
    })

    setFilteredAssignments(sorted)
  }, [filter, sort, assignments])

  const handleSort = (key: string) => {
    if (sort.key === key) {
      setSort({ ...sort, order: sort.order === "asc" ? "desc" : "asc" })
    } else {
      setSort({ key, order: "asc" })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Course Assignments</h1>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Filter by course or assignee..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Sort By</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem
              checked={sort.key === "courseName"}
              onCheckedChange={() => handleSort("courseName")}
            >
              Course Name
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort.key === "assignee"}
              onCheckedChange={() => handleSort("assignee")}
            >
              Assignee
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort.key === "status"}
              onCheckedChange={() => handleSort("status")}
            >
              Status
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={sort.key === "dueDate"}
              onCheckedChange={() => handleSort("dueDate")}
            >
              Due Date
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("courseName")}>
              Course Name
            </TableHead>
            <TableHead onClick={() => handleSort("assignee")}>
              Assignee
            </TableHead>
            <TableHead onClick={() => handleSort("status")}>Status</TableHead>
            <TableHead onClick={() => handleSort("dueDate")}>
              Due Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAssignments.map(assignment => (
            <TableRow key={assignment.id}>
              <TableCell>{assignment.courseName}</TableCell>
              <TableCell>{assignment.assignee}</TableCell>
              <TableCell>{assignment.status}</TableCell>
              <TableCell>{assignment.dueDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
