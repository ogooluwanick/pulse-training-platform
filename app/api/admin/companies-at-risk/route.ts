import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Company from '@/lib/models/Company';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const assignments = await CourseAssignment.find({}).populate({
      path: 'employee',
      model: User,
    });

    // Group assignments by company to identify companies at risk
    const companyRiskMap = new Map();
    const now = new Date();

    assignments.forEach((assignment) => {
      const employee = assignment.employee as any;
      if (!employee) return;
      // Derive company via assignment's companyId
      const companyId = (assignment.companyId as any)?.toString();
      if (!companyId) return;

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
        if (!companyRiskMap.has(companyId)) {
          companyRiskMap.set(companyId, {
            id: companyId,
            name: employee.companyName || 'Unknown Company',
            status: assignmentStatus,
            employeesAtRisk: 0,
            totalEmployees: 0,
            assignments: [],
          });
        }

        const companyRisk = companyRiskMap.get(companyId);
        companyRisk.assignments.push({
          courseId: assignment.course,
          status: assignment.status,
          endDate: assignment.endDate,
          isOverdue,
          employeeId: employee._id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
        });

        // Update status to 'overdue' if any assignment is overdue
        if (isOverdue) {
          companyRisk.status = 'overdue';
        }
      }
    });

    // Get company details and calculate employee counts
    const companiesAtRisk = [];
    for (const [companyId, companyRisk] of companyRiskMap) {
      const company = await Company.findById(companyId);
      if (company) {
        companyRisk.name = company.name;
        // Count employees via memberships
        const totalEmployees = await User.countDocuments({
          'memberships.companyId': company._id,
        });
        companyRisk.totalEmployees = totalEmployees;

        // Count unique employees at risk
        const uniqueEmployeesAtRisk = new Set(
          companyRisk.assignments.map((a: any) => a.employeeId.toString())
        );
        companyRisk.employeesAtRisk = uniqueEmployeesAtRisk.size;

        companiesAtRisk.push(companyRisk);
      }
    }

    return NextResponse.json(companiesAtRisk);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
