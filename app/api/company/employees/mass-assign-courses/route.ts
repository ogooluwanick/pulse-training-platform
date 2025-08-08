import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import Company from '@/lib/models/Company';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { handleBulkCourseAssignment } from '@/lib/notificationActivityService';
import { requireCompanyContext, getCompanyEmployees } from '@/lib/user-utils';

export async function POST(request: NextRequest) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const {
      employeeIds,
      courseIds,
      assignmentType,
      interval,
      endDate,
      companyId,
    } = await request.json();

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

    // Validate company access using the new membership system
    const validatedCompanyId = await requireCompanyContext(session, companyId);

    // Get company info
    const company = await Company.findById(validatedCompanyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Get employees for this specific company
    const companyEmployees = await getCompanyEmployees(validatedCompanyId);
    const employeeIdsInCompany = companyEmployees.map((emp) =>
      emp._id.toString()
    );

    // Filter employeeIds to only include those who are members of this company
    const validEmployeeIds = employeeIds.filter((id) =>
      employeeIdsInCompany.includes(id)
    );

    if (validEmployeeIds.length === 0) {
      return NextResponse.json(
        { message: 'No valid employees found for this company' },
        { status: 400 }
      );
    }

    // Get employees and courses info
    const employees = await User.find({ _id: { $in: validEmployeeIds } });
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
        companyId: validatedCompanyId,
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

        bulkResults.push(result);
      } catch (error) {
        console.error('Error in bulk course assignment:', error);
        bulkResults.push({
          success: false,
          error: 'Failed to process course assignment',
        });
      }
    }

    // Create course assignments
    for (const course of courses) {
      for (const employee of employees) {
        try {
          const assignment = await CourseAssignment.create({
            course: course._id,
            employee: employee._id,
            assignmentType,
            interval,
            endDate: endDate ? new Date(endDate) : undefined,
            companyId: validatedCompanyId,
            status: 'not-started',
          });

          createdAssignments.push(assignment);
        } catch (error) {
          console.error('Error creating course assignment:', error);
          // Continue with other assignments even if one fails
        }
      }
    }

    return NextResponse.json({
      message: 'Courses assigned successfully',
      assignmentsCreated: createdAssignments.length,
      bulkResults,
    });
  } catch (error) {
    console.error('Error in mass course assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
