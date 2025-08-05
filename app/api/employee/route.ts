import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || !['ADMIN', 'COMPANY'].includes(token.role as string)) {
    return NextResponse.json(
      { message: 'Not authenticated or not an admin/company' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const companyId =
      token.role === 'COMPANY'
        ? new mongoose.Types.ObjectId(token.id as string)
        : undefined;

    const employees = await User.aggregate([
      {
        $match: {
          role: 'EMPLOYEE',
          ...(companyId ? { companyId } : {}),
        },
      },
      {
        $lookup: {
          from: 'courseassignments',
          localField: '_id',
          foreignField: 'employee',
          as: 'assignments',
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'assignments.course',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $addFields: {
          overallProgress: {
            $cond: {
              if: { $gt: [{ $size: '$assignments' }, 0] },
              then: {
                $round: [
                  {
                    $divide: [
                      {
                        $sum: {
                          $cond: {
                            if: { $eq: ['$assignments.status', 'completed'] },
                            then: 100,
                            else: {
                              $cond: {
                                if: {
                                  $eq: ['$assignments.status', 'in-progress'],
                                },
                                then: 50,
                                else: 0,
                              },
                            },
                          },
                        },
                      },
                      { $size: '$assignments' },
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    // Process each employee to calculate status
    const processedEmployees = await Promise.all(
      employees.map(async (employee) => {
        // Find course assignments for this employee with populated course data
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
        } else if (assignments.length === 0) {
          status = 'on-track'; // Default status for employees with no assignments
        }

        return {
          ...employee,
          overallProgress: Math.round(overallProgress),
          status: status,
        };
      })
    );

    return NextResponse.json(processedEmployees, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
