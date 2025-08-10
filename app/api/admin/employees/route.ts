import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get all employees (users with role EMPLOYEE) and populate company info
    const employees = await User.find({ role: 'EMPLOYEE' })
      .select('-password')
      .populate('memberships.companyId', 'name')
      .populate('activeCompanyId', 'name');

    // Get detailed employee data with progress and assignments
    const employeeData = await Promise.all(
      employees.map(async (employee: any) => {
        // Find course assignments for this employee
        const assignments = await CourseAssignment.find({
          employee: employee._id,
        }).populate({
          path: 'course',
          model: Course,
        });

        const coursesCompleted = assignments.filter(
          (a) => a.status === 'completed'
        ).length;

        // Calculate overall progress based on lesson completion
        let totalProgress = 0;
        let totalLessons = 0;

        assignments.forEach((assignment: any) => {
          const courseData = assignment.course;
          if (courseData && courseData.lessons) {
            const courseLessons = courseData.lessons.length;
            const completedLessons = assignment.lessonProgress
              ? assignment.lessonProgress.filter(
                  (lesson: any) => lesson.status === 'completed'
                ).length
              : 0;

            totalLessons += courseLessons;
            totalProgress += completedLessons;
          }
        });

        const overallProgress =
          totalLessons > 0 ? (totalProgress / totalLessons) * 100 : 0;

        // Determine status based on standardized rules
        let status: 'on-track' | 'at-risk' | 'overdue' = 'on-track';

        if (assignments.length > 0) {
          const now = new Date();
          const overdueAssignments = assignments.filter((assignment: any) => {
            if (assignment.status === 'completed') return false;
            if (!assignment.endDate) return false;
            return new Date(assignment.endDate) < now;
          });

          const atRiskAssignments = assignments.filter((assignment: any) => {
            if (assignment.status === 'completed') return false;
            if (!assignment.endDate) return false;
            const endDate = new Date(assignment.endDate);
            const daysUntilDue =
              (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            return daysUntilDue <= 7 && daysUntilDue > 0;
          });

          if (overdueAssignments.length > 0) {
            status = 'overdue';
          } else if (atRiskAssignments.length > 0) {
            status = 'at-risk';
          }
        }

        // Get company name from active company or memberships
        const activeMembership = employee.memberships?.find(
          (m: any) => m.status === 'active'
        );
        const companyName =
          employee.activeCompanyId?.name ||
          activeMembership?.companyId?.name ||
          'No Company';

        return {
          _id: employee._id,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          department: employee.department,
          companyName: companyName,
          status: employee.status,
          overallProgress,
          coursesCompleted,
          totalAssignments: assignments.length,
          assignments: assignments.map((assignment: any) => ({
            _id: assignment._id,
            courseId: assignment.course._id,
            courseTitle: assignment.course.title,
            status: assignment.status,
            progress: assignment.progress || 0,
            endDate: assignment.endDate,
            completedAt: assignment.completedAt,
          })),
          createdAt: employee.createdAt,
          updatedAt: employee.updatedAt,
        };
      })
    );

    return NextResponse.json(employeeData);
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
