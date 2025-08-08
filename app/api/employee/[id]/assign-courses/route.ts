import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id: employeeId } = params;
    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { message: 'Invalid employeeId' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { assignments } = body;

    const employee = await User.findById(employeeId);

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

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

    const newAssignments = assignments
      .map((assignment: any) => {
        const course = courseMap.get(assignment.courseId);
        if (course) {
          return {
            course: course._id,
            employee: employee._id,
            company: employee.companyId,
            status: 'not-started',
            assignmentType: assignment.type,
            interval: assignment.interval,
          };
        }
        return null;
      })
      .filter(Boolean);

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
