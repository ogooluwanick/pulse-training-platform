import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Activity from '@/lib/models/Activity';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    // Get total companies and employees
    const totalCompanies = await Company.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'EMPLOYEE' });

    // Get all course assignments across all companies
    const allAssignments = await CourseAssignment.find({}).populate('employee');

    // Calculate overall compliance across all companies
    const totalAssignments = allAssignments.length;
    const completedAssignments = allAssignments.filter(
      (a) => a.status === 'completed'
    ).length;

    const overallCompliance =
      totalAssignments > 0
        ? Math.min((completedAssignments / totalAssignments) * 100, 100)
        : 0;

    // Calculate average completion time across all companies
    let totalCompletionTime = 0;
    let completedAssignmentsWithTime = 0;

    allAssignments.forEach((assignment) => {
      if (
        assignment.status === 'completed' &&
        assignment.completedAt &&
        assignment.createdAt
      ) {
        const completionTime =
          (new Date(assignment.completedAt).getTime() -
            new Date(assignment.createdAt).getTime()) /
          (1000 * 60 * 60 * 24); // Convert to days
        totalCompletionTime += completionTime;
        completedAssignmentsWithTime++;
      }
    });

    const avgCompletionTime =
      completedAssignmentsWithTime > 0
        ? Math.round(totalCompletionTime / completedAssignmentsWithTime)
        : 0;

    // Calculate companies at risk using similar criteria to employees at risk
    const companiesAtRisk = new Set();
    const employeesAtRisk = new Set();
    const now = new Date();

    // Group assignments by company
    const companyAssignments = new Map();

    allAssignments.forEach((assignment) => {
      const employee = assignment.employee as any;
      if (!employee || !employee.companyId) return;

      const companyId = employee.companyId.toString();
      if (!companyAssignments.has(companyId)) {
        companyAssignments.set(companyId, []);
      }
      companyAssignments.get(companyId).push(assignment);
    });

    // Check each company for risk criteria
    companyAssignments.forEach((assignments, companyId) => {
      let companyHasRisk = false;
      let companyEmployeesAtRisk = 0;

      assignments.forEach((assignment: any) => {
        // Skip completed assignments
        if (assignment.status === 'completed') return;

        const assignedDate = assignment.createdAt
          ? new Date(assignment.createdAt)
          : null;
        if (!assignedDate) return;

        const diffDays =
          (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);

        // Check for overdue: more than 14 days old and not completed
        if (diffDays > 14) {
          companyHasRisk = true;
          companyEmployeesAtRisk++;
          employeesAtRisk.add(assignment.employee.toString());
          return;
        }

        // Check for at-risk: less than 50% progress after 5 days
        if (diffDays > 5) {
          const courseData = assignment.course;
          if (courseData && courseData.lessons) {
            const courseLessons = courseData.lessons.length;
            const completedLessons = assignment.lessonProgress
              ? assignment.lessonProgress.filter(
                  (lesson: any) => lesson.status === 'completed'
                ).length
              : 0;

            const assignmentProgress =
              courseLessons > 0 ? (completedLessons / courseLessons) * 100 : 0;

            if (assignmentProgress < 50) {
              companyHasRisk = true;
              companyEmployeesAtRisk++;
              employeesAtRisk.add(assignment.employee.toString());
            }
          }
        }
      });

      if (companyHasRisk) {
        companiesAtRisk.add(companyId);
      }
    });

    const platformRisk = {
      companiesAtRisk: companiesAtRisk.size,
      employeesAtRisk: employeesAtRisk.size,
    };

    return NextResponse.json({
      totalCompanies,
      totalEmployees,
      overallCompliance: Math.round(overallCompliance),
      avgCompletionTime,
      platformRisk,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard metrics:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
