import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get all companies
    const companies = await Company.find();

    const companiesAtRisk = [];

    for (const company of companies) {
      const employeeIds = (
        await User.find({ 'memberships.companyId': company._id }, '_id')
      ).map((u) => u._id);

      if (employeeIds.length === 0) continue;

      // Get assignments for this company's employees
      const assignments = await CourseAssignment.find({
        employee: { $in: employeeIds },
      }).populate({
        path: 'course',
        model: Course,
        select: 'title',
      });

      if (assignments.length === 0) continue;

      const now = new Date();
      let employeesAtRisk = 0;
      let totalEmployees = employeeIds.length;
      let overdueAssignments = [];

      // Check each assignment for risk
      assignments.forEach((assignment) => {
        if (assignment.status === 'completed') return;

        const employee = await User.findById(assignment.employee).select(
          'firstName lastName'
        );

        if (!employee) return;

        // Check for overdue assignments
        if (assignment.endDate && new Date(assignment.endDate) < now) {
          employeesAtRisk++;
          overdueAssignments.push({
            courseId: assignment.course._id,
            courseTitle: assignment.course.title,
            status: assignment.status,
            endDate: assignment.endDate,
            employeeId: assignment.employee.toString(),
            employeeName: `${employee.firstName} ${employee.lastName}`,
            isOverdue: true,
          });
        }
      });

      // Determine company status
      let status: 'on-track' | 'at-risk' | 'overdue' = 'on-track';
      if (employeesAtRisk > 0) {
        status = 'overdue';
      } else if (assignments.some((a) => a.status === 'in_progress')) {
        status = 'at-risk';
      }

      if (employeesAtRisk > 0 || status === 'at-risk') {
        companiesAtRisk.push({
          id: company._id.toString(),
          name: company.name,
          status,
          employeesAtRisk,
          totalEmployees,
          assignments: overdueAssignments,
        });
      }
    }

    return NextResponse.json(companiesAtRisk);
  } catch (error) {
    console.error('Error fetching companies at risk:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
