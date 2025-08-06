import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get platform-wide statistics
    const totalCompanies = await Company.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'EMPLOYEE' });
    const totalCourses = await Course.countDocuments();

    // Get all assignments for compliance calculation
    const assignments = await CourseAssignment.find().populate('employee');

    // Calculate overall compliance
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === 'completed'
    ).length;
    const overallCompliance =
      totalAssignments > 0
        ? Math.min((completedAssignments / totalAssignments) * 100, 100)
        : 0;

    // Calculate employees at risk
    const now = new Date();
    const employeesAtRisk = new Set();
    const companiesAtRisk = new Set();

    assignments.forEach((assignment) => {
      const employee = assignment.employee as any;
      if (!employee) return;

      // Skip completed assignments
      if (assignment.status === 'completed') return;

      // Check for overdue assignments
      if (assignment.endDate && new Date(assignment.endDate) < now) {
        employeesAtRisk.add(employee._id.toString());
        if (employee.companyId) {
          companiesAtRisk.add(employee.companyId.toString());
        }
      }
    });

    // Calculate average completion time
    const completedAssignmentsWithTime = assignments.filter(
      (a) => a.status === 'completed' && a.completedAt && a.createdAt
    );

    let avgCompletionTime = 0;
    if (completedAssignmentsWithTime.length > 0) {
      const totalTime = completedAssignmentsWithTime.reduce(
        (sum, assignment) => {
          const completionDate = new Date(assignment.completedAt);
          const creationDate = new Date(assignment.createdAt);
          return sum + (completionDate.getTime() - creationDate.getTime());
        },
        0
      );
      avgCompletionTime =
        totalTime /
        (completedAssignmentsWithTime.length * (1000 * 60 * 60 * 24)); // Convert to days
    }

    return NextResponse.json({
      totalCompanies,
      totalEmployees,
      overallCompliance: Math.round(overallCompliance),
      avgCompletionTime: Math.round(avgCompletionTime),
      platformRisk: {
        companiesAtRisk: companiesAtRisk.size,
        employeesAtRisk: employeesAtRisk.size,
      },
    });
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
