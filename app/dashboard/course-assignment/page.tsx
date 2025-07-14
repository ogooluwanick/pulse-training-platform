import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Course Assignment",
}

export default function CourseAssignmentPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <h1 className="text-3xl font-bold">Course Assignment</h1>
    </div>
  )
}
