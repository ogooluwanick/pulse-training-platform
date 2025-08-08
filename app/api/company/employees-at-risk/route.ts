import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Company from '@/lib/models/Company';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import { getCompanyEmployees, requireCompanyContext } from '@/lib/user-utils';

export async function GET(request: Request) {
  console.log('[EmployeesAtRisk] API endpoint called');

  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    console.log('[EmployeesAtRisk] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('[EmployeesAtRisk] Unauthorized access attempt');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const activeCompanyId = await requireCompanyContext(session);
    const companyId = new mongoose.Types.ObjectId(activeCompanyId);

    console.log('[EmployeesAtRisk] Company context:', {
      activeCompanyId,
      companyId: companyId.toString(),
    });

    const employees = await getCompanyEmployees(activeCompanyId);
    console.log('[EmployeesAtRisk] Employees found:', employees.length);

    const assignments = await CourseAssignment.find({
      employee: { $in: employees.map((e: any) => e._id) },
      companyId,
    }).populate({
      path: 'employee',
      model: User,
    });

    console.log('[EmployeesAtRisk] Assignments found:', assignments.length);

    // Filter out assignments for company accounts
    const filteredAssignments = assignments.filter((assignment: any) => {
      const employee = assignment.employee;
      return employee && employee.role !== 'COMPANY';
    });

    // Group assignments by employee to identify employees at risk using standardized rules
    const employeeRiskMap = new Map();
    const now = new Date();

    filteredAssignments.forEach((assignment) => {
      const employee = assignment.employee as any;
      if (!employee) return;

      const employeeId = employee._id.toString();

      // Skip completed assignments
      if (assignment.status === 'completed') return;

      const assignedDate = assignment.createdAt
        ? new Date(assignment.createdAt)
        : null;
      if (!assignedDate) return;

      const diffDays =
        (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);

      let assignmentStatus = null;
      let isOverdue = false;

      // Check for overdue: more than 14 days old and not completed
      if (diffDays > 14) {
        assignmentStatus = 'overdue';
        isOverdue = true;
      }
      // Check for at-risk: less than 50% progress after 5 days
      else if (diffDays > 5) {
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
            assignmentStatus = 'at-risk';
          }
        }
      }

      if (assignmentStatus) {
        if (!employeeRiskMap.has(employeeId)) {
          employeeRiskMap.set(employeeId, {
            id: employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            department: employee.department || 'Unknown',
            status: assignmentStatus,
            assignments: [],
          });
        }

        const employeeRisk = employeeRiskMap.get(employeeId);
        employeeRisk.assignments.push({
          courseId: assignment.course,
          status: assignment.status,
          endDate: assignment.endDate,
          isOverdue,
        });

        // Update status to 'overdue' if any assignment is overdue
        if (isOverdue) {
          employeeRisk.status = 'overdue';
        }
      }
    });

    const employeesAtRisk = Array.from(employeeRiskMap.values());

    console.log(
      '[EmployeesAtRisk] Employees at risk found:',
      employeesAtRisk.length
    );
    console.log('[EmployeesAtRisk] Returning data:', employeesAtRisk);

    return NextResponse.json(employeesAtRisk);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
