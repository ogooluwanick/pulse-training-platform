import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Course from '@/lib/models/Course';
import { scheduleIntervalAssignment } from '@/lib/cron-manager';
import { handleCourseEnrollment } from '@/lib/notificationActivityService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: employeeId } = params;
    const { assignments } = await req.json();

    if (!employeeId || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { message: 'Missing employeeId or assignments' },
        { status: 400 }
      );
    }

    const existingAssignments = await CourseAssignment.find({
      employee: employeeId,
    }).populate('course');

    const existingCourseIds = existingAssignments.map((a) =>
      a.course._id.toString()
    );
    const newCourseIds = assignments.map((a) => a.courseId);

    // Filter out already assigned courses
    const newAssignments = assignments.filter(
      (assignment) => !existingCourseIds.includes(assignment.courseId)
    );

    if (newAssignments.length === 0) {
      return NextResponse.json(
        { message: 'All courses are already assigned to this employee' },
        { status: 400 }
      );
    }

    // Get employee and company info
    const employee = await User.findById(employeeId);
    if (!employee) {
      return new NextResponse('Employee not found', { status: 404 });
    }

    const company = await User.findById(session.user.companyId);
    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const createdAssignments = [];
    const notificationResults = [];

    for (const assignment of newAssignments) {
      const { courseId, assignmentType, interval, endDate } = assignment;

      // Create course assignment
      const newAssignment = new CourseAssignment({
        course: courseId,
        employee: employeeId,
        assignmentType,
        interval,
        endDate: endDate ? new Date(endDate) : undefined,
        companyId: session.user.companyId,
        status: 'not-started',
        lessonProgress: [],
      });

      await newAssignment.save();
      createdAssignments.push(newAssignment);

      // Get course info for notifications
      const course = await Course.findById(courseId);
      if (course) {
        // Create enrollment activity and notification
        try {
          const result = await handleCourseEnrollment(
            {
              id: employeeId,
              email: employee.email,
              firstName: employee.firstName,
              lastName: employee.lastName,
              companyId: employee.companyId?.toString(),
            },
            {
              id: courseId,
              title: course.title,
            },
            true // Send email notification
          );

          notificationResults.push({
            courseId,
            courseTitle: course.title,
            notification: result.notification,
            activity: result.activity,
            email: result.email,
          });

          console.log(
            `[Course Assignment] Enrollment handled for employee ${employeeId} and course ${courseId}`
          );
        } catch (error) {
          console.error(
            `[Course Assignment] Error handling enrollment for course ${courseId}:`,
            error
          );
          // Continue with other assignments even if one fails
        }
      }

      // Schedule interval assignment if needed
      if (assignmentType === 'interval' && interval) {
        await scheduleIntervalAssignment(newAssignment._id.toString());
      }
    }

    return NextResponse.json({
      message: 'Courses assigned successfully',
      createdAssignments: createdAssignments.length,
      notificationResults,
    });
  } catch (error) {
    console.error('Error assigning courses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
