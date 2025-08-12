import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Company from '@/lib/models/Company';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import {
  getCompanyEmployees,
  requireCompanyContext,
  resolveCompanyIdFromRequest,
} from '@/lib/user-utils';

export async function GET(request: Request) {
  console.log('[DashboardMetrics] API endpoint called');

  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    console.log('[DashboardMetrics] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('[DashboardMetrics] Unauthorized access attempt');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return new NextResponse('Company ID not found in session', {
        status: 400,
      });
    }

    // Get employees via memberships
    const filteredEmployees = await getCompanyEmployees(companyId);
    console.log('[DashboardMetrics] Company ID:', companyId);
    console.log(
      '[DashboardMetrics] Total employees found:',
      filteredEmployees.length
    );

    const totalEmployees = filteredEmployees.length;

    if (totalEmployees === 0) {
      console.log(
        '[DashboardMetrics] No employees found, returning empty metrics'
      );
      return NextResponse.json({
        overallCompliance: 0,
        totalEmployees: 0,
        employeesAtRisk: 0,
        avgCompletionTime: 0,
        employeesAtRiskPercentage: 0,
      });
    }

    const employeeIds = filteredEmployees.map((emp: any) => emp._id);
    console.log('[DashboardMetrics] Employee IDs:', employeeIds);

    const assignments = await CourseAssignment.find({
      employee: { $in: employeeIds },
      companyId: new mongoose.Types.ObjectId(companyId),
    }).populate('employee');

    console.log(
      '[DashboardMetrics] Course assignments found:',
      assignments.length
    );

    // Calculate compliance based on completed assignments vs total assignments
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(
      (a) => a.status === 'completed'
    ).length;

    // Calculate overall compliance as percentage of completed assignments
    const overallCompliance =
      totalAssignments > 0
        ? Math.min((completedAssignments / totalAssignments) * 100, 100) // Cap at 100%
        : 0;

    // Calculate employees at risk using standardized rules
    const employeesAtRisk = new Set();
    const now = new Date();

    assignments.forEach((assignment) => {
      const employee = assignment.employee as any;
      if (!employee) return;

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
        employeesAtRisk.add(employee._id.toString());
        return;
      }

      // Check for at-risk: less than 50% progress after 5 days
      if (diffDays > 5) {
        // Calculate progress for this assignment
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
            employeesAtRisk.add(employee._id.toString());
          }
        }
      }
    });

    // Calculate average completion time in days
    let totalCompletionTime = 0;
    let completedAssignmentsWithTime = 0;

    assignments.forEach((assignment) => {
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

    const employeesAtRiskPercentage =
      totalEmployees > 0
        ? Math.min((employeesAtRisk.size / totalEmployees) * 100, 100) // Cap at 100%
        : 0;

    const metrics = {
      overallCompliance: Math.round(overallCompliance),
      totalEmployees,
      employeesAtRisk: employeesAtRisk.size,
      avgCompletionTime,
      employeesAtRiskPercentage: Math.round(employeesAtRiskPercentage),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
