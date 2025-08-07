import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import Company from '@/lib/models/Company';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { handleBulkCourseAssignment } from '@/lib/notificationActivityService';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeIds, courseIds, assignmentType, interval, endDate } =
      await request.json();

    if (
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return NextResponse.json(
        { message: 'Employee IDs are required' },
        { status: 400 }
      );
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { message: 'Course IDs are required' },
        { status: 400 }
      );
    }

    // Check if companyId exists in session
    if (!session.user.companyId) {
      return NextResponse.json(
        { message: 'Company ID not found in session' },
        { status: 400 }
      );
    }

    // Get company info
    const company = await Company.findById(session.user.companyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Get employees and courses info
    const employees = await User.find({ _id: { $in: employeeIds } });
    const courses = await Course.find({ _id: { $in: courseIds } });

    if (employees.length === 0) {
      return NextResponse.json(
        { message: 'No valid employees found' },
        { status: 400 }
      );
    }

    if (courses.length === 0) {
      return NextResponse.json(
        { message: 'No valid courses found' },
        { status: 400 }
      );
    }

    const createdAssignments = [];
    const bulkResults = [];

    // Process each course for each employee
    for (const course of courses) {
      const courseUserInfos = employees.map((employee) => ({
        id: employee._id.toString(),
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        companyId: employee.companyId?.toString(),
      }));

      const courseInfo = {
        id: course._id.toString(),
        title: course.title,
      };

      // Handle bulk course assignment with notifications
      try {
        const result = await handleBulkCourseAssignment(
          courseUserInfos,
          courseInfo,
          true // Send email notifications
        );

        bulkResults.push({
          courseId: course._id.toString(),
          courseTitle: course.title,
          notifications: result.notifications.length,
          activities: result.activities.length,
          emails: result.emails.length,
        });

        console.log(
          `[Mass Assignment] Bulk assignment handled for course ${course._id} with ${courseUserInfos.length} employees`
        );
      } catch (error) {
        console.error(
          `[Mass Assignment] Error handling bulk assignment for course ${course._id}:`,
          error
        );
        // Continue with other courses even if one fails
      }

      // Create course assignments
      for (const employee of employees) {
        // Remove the duplicate check - allow multiple assignments of the same course
        // const existingAssignment = await CourseAssignment.findOne({
        //   course: course._id,
        //   employee: employee._id,
        // });

        // if (!existingAssignment) {
        const newAssignment = new CourseAssignment({
          course: course._id,
          employee: employee._id,
          assignmentType: assignmentType || 'one-time',
          interval: interval || undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          companyId: session.user.companyId,
          status: 'not-started',
          lessonProgress: [],
        });

        await newAssignment.save();
        createdAssignments.push(newAssignment);
        // }
      }
    }

    return NextResponse.json({
      message: 'Courses assigned successfully to all employees',
      createdAssignments: createdAssignments.length,
      bulkResults,
    });
  } catch (error) {
    console.error('Error in mass course assignment:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
