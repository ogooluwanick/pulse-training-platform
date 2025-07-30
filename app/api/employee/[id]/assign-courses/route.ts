import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';

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

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'Not authenticated or not an admin' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { assignments } = body;

    const employee = await User.findById(params.id);

    if (!employee) {
      return NextResponse.json(
        { message: 'Employee not found' },
        { status: 404 }
      );
    }

    for (const assignment of assignments) {
      const course = await Course.findById(assignment.courseId);
      if (course) {
        await CourseAssignment.create({
          course: course._id,
          employee: employee._id,
          company: employee.companyId,
          status: 'assigned',
          assignmentType: assignment.type,
          interval: assignment.interval,
        });
      }
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
