import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export const dynamic = 'force-dynamic'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Course from "@/lib/models/Course"
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

    const company = await Company.findById(companyId)
    if (!company) {
      return new NextResponse("Company not found", { status: 404 })
    }

    const courses = await Course.find({ companyId: companyId })

    const completionRates = await Promise.all(
      courses.map(async (course) => {
        const assignments = await CourseAssignment.find({
          course: course._id,
          employee: { $in: company.employees },
        })
        const completedAssignments = assignments.filter(
          (a) => a.status === "completed"
        ).length
        const rate =
          assignments.length > 0
            ? (completedAssignments / assignments.length) * 100
            : 0
        return {
          course: course.title,
          rate: Math.round(rate),
        }
      })
    )

    return NextResponse.json(completionRates)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
