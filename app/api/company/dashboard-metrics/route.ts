import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

export const dynamic = 'force-dynamic'
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Company from "@/lib/models/Company"
import CourseAssignment from "@/lib/models/CourseAssignment"
import dbConnect from "@/lib/dbConnect"
import mongoose from "mongoose"

export async function GET(request: Request) {
  try {
    await dbConnect()
    const session = await getServerSession(authOptions)
    if (!session || !session.user || session.user.role !== "COMPANY") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return new NextResponse("Company ID is required", { status: 400 })
    }

    const company = await Company.findById(companyId)
    if (!company) {
      return new NextResponse("Company not found", { status: 404 })
    }

    const totalEmployees = company.employees.length

    const assignments = await CourseAssignment.find({
      employeeId: { $in: company.employees },
    }).populate("employeeId")

    const completedAssignments = assignments.filter(
      (a) => a.status === "completed"
    ).length
    const overallCompliance =
      totalEmployees > 0
        ? (completedAssignments / (totalEmployees * 1)) * 100
        : 0 // Assuming 1 course per employee for now

    const employeesAtRisk = assignments.filter((a) => {
      const employee = a.employeeId as any
      return (
        employee &&
        (employee.status === "at-risk" || employee.status === "overdue")
      )
    }).length

    const avgCompletionTime = 0 // This would be more complex to calculate

    const employeesAtRiskPercentage =
      totalEmployees > 0 ? (employeesAtRisk / totalEmployees) * 100 : 0

    const metrics = {
      overallCompliance: Math.round(overallCompliance),
      totalEmployees,
      employeesAtRisk,
      avgCompletionTime,
      employeesAtRiskPercentage: Math.round(employeesAtRiskPercentage),
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error(error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
