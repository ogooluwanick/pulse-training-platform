import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as any;
    const companyId = new mongoose.Types.ObjectId(user.companyId);

    const company = await Company.findById(companyId).populate({
      path: 'employees',
      model: User,
    });

    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const employeeData = await Promise.all(
      company.employees.map(async (employee: any) => {
        // Find course assignments for this employee
        const assignments = await CourseAssignment.find({
          employee: employee._id,
        }).populate({
          path: 'course',
          model: 'Course',
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

        // Check for overdue: courses assigned more than 14 days ago that aren't completed
        const now = new Date();
        const overdueAssignments = assignments.filter((assignment: any) => {
          if (assignment.status === 'completed') return false;
          if (!assignment.createdAt) return false;

          const assignedDate = new Date(assignment.createdAt);
          const diffDays =
            (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays > 14;
        });

        // Check for at-risk: overall progress less than 50% after 5 days
        const atRiskAssignments = assignments.filter((assignment: any) => {
          if (assignment.status === 'completed') return false;
          if (!assignment.createdAt) return false;

          const assignedDate = new Date(assignment.createdAt);
          const diffDays =
            (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);

          // Only consider at-risk if assignment is older than 5 days
          if (diffDays <= 5) return false;

          // Calculate progress for this assignment
          const courseData = assignment.course;
          if (!courseData || !courseData.lessons) return false;

          const courseLessons = courseData.lessons.length;
          const completedLessons = assignment.lessonProgress
            ? assignment.lessonProgress.filter(
                (lesson: any) => lesson.status === 'completed'
              ).length
            : 0;

          const assignmentProgress =
            courseLessons > 0 ? (completedLessons / courseLessons) * 100 : 0;
          return assignmentProgress < 50;
        });

        // Determine status
        if (overdueAssignments.length > 0) {
          status = 'overdue';
        } else if (atRiskAssignments.length > 0) {
          status = 'at-risk';
        } else if (
          assignments.length > 0 &&
          assignments.every((a: any) => a.status === 'completed')
        ) {
          status = 'on-track';
        }

        // Calculate time invested (for completed courses)
        const timeInvested = assignments
          .filter((a: any) => a.status === 'completed')
          .reduce((total: number, assignment: any) => {
            return total + (assignment.course?.duration || 0);
          }, 0);

        return {
          id: employee._id,
          name:
            `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
            'Unknown Employee',
          email: employee.email,
          role: employee.role,
          department: employee.department || 'N/A',
          overallProgress: Math.round(overallProgress),
          coursesAssigned: assignments.length,
          coursesCompleted: coursesCompleted,
          overdueCourses: 0, // Removed old calculation, keeping for backward compatibility
          timeInvested: timeInvested,
          lastActivity: employee.updatedAt
            ? new Date(employee.updatedAt).toISOString()
            : 'N/A',
          status: status,
          profileImageUrl: employee.profileImageUrl,
        };
      })
    );

    return NextResponse.json(employeeData);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
