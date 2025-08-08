import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Course from '@/lib/models/Course';
import Company from '@/lib/models/Company';
import { scheduleIntervalAssignment } from '@/lib/cron-manager';
import { handleCourseEnrollment } from '@/lib/notificationActivityService';
import { requireCompanyContext, hasCompanyAccess } from '@/lib/user-utils';

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

    // Remove the duplicate check - allow multiple assignments of the same course
    // const existingCourseIds = existingAssignments.map((a) =>
    //   a.course._id.toString()
    // );
    // const newCourseIds = assignments.map((a) => a.courseId);

    // // Filter out already assigned courses
    // const newAssignments = assignments.filter(
    //   (assignment) => !existingCourseIds.includes(assignment.courseId)
    // );

    // if (newAssignments.length === 0) {
    //   return NextResponse.json(
    //     { message: 'All courses are already assigned to this employee' },
    //     { status: 400 }
    //   );
    // }

    // Process all assignments - allow duplicates
    const newAssignments = assignments;

    // Get employee and company info
    const employee = await User.findById(employeeId);
    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Validate company context from session.activeCompanyId
    const validatedCompanyId = await requireCompanyContext(session);

    const company = await Company.findById(validatedCompanyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Ensure the target employee belongs to this company
    const employeeBelongs = await hasCompanyAccess(
      employeeId,
      validatedCompanyId
    );
    if (!employeeBelongs) {
      return NextResponse.json(
        { message: 'Employee does not belong to this company' },
        { status: 400 }
      );
    }

    const createdAssignments = [];
    const notificationResults = [];

    for (const assignment of newAssignments) {
      const { courseId, type, assignmentType, interval, endDate } = assignment;

      // Use assignmentType if provided, otherwise fall back to type
      const finalAssignmentType = assignmentType || type || 'one-time';

      // Create course assignment
      const newAssignment = new CourseAssignment({
        course: courseId,
        employee: employeeId,
        assignmentType: finalAssignmentType,
        interval,
        endDate: endDate ? new Date(endDate) : undefined,
        companyId: validatedCompanyId,
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
              companyId: validatedCompanyId,
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
      if (finalAssignmentType === 'interval' && interval) {
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
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
