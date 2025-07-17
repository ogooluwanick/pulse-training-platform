import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export const dynamic = 'force-dynamic'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import User from "@/lib/models/User"
import CourseAssignment from "@/lib/models/CourseAssignment"
import dbConnect from "@/lib/dbConnect"
import Company from "@/lib/models/Company"
import mongoose from "mongoose"

export async function GET() {
  try {
    await dbConnect()

    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "COMPANY") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = session.user as any
    const companyId = new mongoose.Types.ObjectId(user.companyId)

    const company = await Company.findById(companyId).populate({
      path: "employees",
      model: User,
    })

    if (!company) {
      return new NextResponse("Company not found", { status: 404 })
    }

    const employeeData = await Promise.all(
      company.employees.map(async (employee: any) => {
        const assignments = await CourseAssignment.find({
          employeeId: employee._id,
        })
        const coursesCompleted = assignments.filter(
          (a) => a.status === "completed"
        ).length
        const overallProgress =
          assignments.length > 0
            ? (coursesCompleted / assignments.length) * 100
            : 0

        // This is a simplified status. A real implementation would be more complex.
        let status: "on-track" | "at-risk" | "overdue" = "on-track"
        if (overallProgress < 50) {
          status = "at-risk"
        }
        if (overallProgress < 25) {
          status = "overdue"
        }

        return {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          role: employee.role,
          department: employee.department || "N/A",
          overallProgress: Math.round(overallProgress),
          coursesAssigned: assignments.length,
          coursesCompleted: coursesCompleted,
          lastActivity: "N/A", // This would require tracking last login or activity
          status: status,
        }
      })
    )

    return NextResponse.json(employeeData)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
