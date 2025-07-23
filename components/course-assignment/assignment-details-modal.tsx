"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

interface Assignment {
  _id: string
  course: {
    _id: string
    title: string
    category: "compliance" | "skills" | "culture" | "technical"
  }
  assignee: {
    _id: string
    name: string
    avatar: string
  }
  status: "completed" | "in-progress" | "pending"
  dueDate: string
  progress: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  assignment: Assignment | null
}

const mockTestQuestions = [
  {
    question: "What is the difference between `let` and `const` in JavaScript?",
    answer:
      "`let` allows you to reassign the variable, while `const` creates a constant reference to a value that cannot be changed.",
  },
  {
    question: "What are React Hooks?",
    answer:
      "Hooks are functions that let you “hook into” React state and lifecycle features from function components.",
  },
]

export default function AssignmentDetailsModal({
  isOpen,
  onClose,
  assignment,
}: Props) {
  if (!assignment) return null

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "bg-success-green text-alabaster"
      case "in-progress":
        return "bg-warning-ochre text-alabaster"
      case "pending":
        return "bg-charcoal text-alabaster"
      default:
        return "bg-warm-gray text-alabaster"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-alabaster">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal">
            {assignment.course.title}
          </DialogTitle>
          <DialogDescription>
            Assigned to{" "}
            <span className="font-semibold text-charcoal">
              {assignment.assignee.name}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage
                  src={assignment.assignee.avatar}
                  alt={assignment.assignee.name}
                />
                <AvatarFallback>
                  {assignment.assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{assignment.assignee.name}</span>
            </div>
            <Badge className={getStatusColor(assignment.status)}>
              {assignment.status}
            </Badge>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Progress
            </h3>
            <div className="flex items-center gap-4">
              <Progress value={assignment.progress} className="w-full" />
              <span className="font-semibold">{assignment.progress}%</span>
            </div>
          </div>
          <div className="text-sm text-warm-gray">
            Due on {format(new Date(assignment.dueDate), "PPP")}
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold text-charcoal mb-2">
              Test Questions
            </h3>
            <div className="space-y-4">
              {mockTestQuestions.map((item, index) => (
                <div key={index}>
                  <p className="font-semibold">{item.question}</p>
                  <p className="text-warm-gray">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
