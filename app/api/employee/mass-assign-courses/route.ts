import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { employeeIds, assignments } = body;

    const employees = await User.find({ _id: { $in: employeeIds } });
    const courseIds = assignments.map((a: any) => a.courseId);
    // For admin and company users, allow access to all courses regardless of status
    // For employees, only allow access to published courses
    const statusFilter =
      token.role === 'EMPLOYEE' ? { status: 'published' } : {};

    const courses = await Course.find({
      _id: { $in: courseIds },
      ...statusFilter,
    });
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    const newAssignments: any[] = [];
    for (const employee of employees) {
      for (const assignment of assignments) {
        const course = courseMap.get(assignment.courseId);
        if (course) {
          newAssignments.push({
            course: course._id,
            employee: employee._id,
            company: employee.companyId,
            status: 'not-started',
            assignmentType: assignment.type,
            interval: assignment.interval,
          });
        }
      }
    }

    if (newAssignments.length > 0) {
      await CourseAssignment.insertMany(newAssignments);
    }

    return NextResponse.json(
      { message: 'Courses assigned successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to assign courses:', error);
    return NextResponse.json(
      { message: 'Failed to assign courses' },
      { status: 500 }
    );
  }
}
