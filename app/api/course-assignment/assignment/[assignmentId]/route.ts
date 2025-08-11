import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Types } from 'mongoose';
import Course from '@/lib/models/Course';

export async function GET(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log('[Assignment API] No session found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const assignmentId = params.assignmentId;
  const userId = session.user.id;
  const userRole = session.user.role;

  try {
    console.log('[Assignment API] Request received', {
      assignmentId,
      userId,
      userRole,
      timestamp: new Date().toISOString(),
    });

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(assignmentId)) {
      console.error(
        '[Assignment API] Invalid assignment ID format:',
        assignmentId
      );
      return NextResponse.json(
        { message: 'Invalid assignment ID format' },
        { status: 400 }
      );
    }

    // Build query based on user role
    let query: any = {
      _id: new Types.ObjectId(assignmentId),
    };

    if (userRole === 'EMPLOYEE') {
      // Employees can only view their own assignments
      query.employee = new Types.ObjectId(userId);
    } else if (userRole === 'COMPANY' || userRole === 'ADMIN') {
      // Company users and admins can view assignments within their company
      // For company users, we need to get their company ID
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      const companyId = user.activeCompanyId || user.companyId;
      if (!companyId) {
        return NextResponse.json(
          { message: 'Company not found' },
          { status: 404 }
        );
      }

      query.companyId = new Types.ObjectId(companyId);
    } else {
      return NextResponse.json(
        { message: 'Unauthorized role' },
        { status: 403 }
      );
    }

    // Find the assignment and populate the course
    const assignment = await CourseAssignment.findOne(query).populate({
      path: 'course',
      model: Course,
      match: { status: 'published' }, // Only allow published courses
    });

    console.log('[Assignment API] Assignment query result', {
      assignmentId,
      userId,
      userRole,
      query,
      assignmentFound: !!assignment,
      hasCourse: !!assignment?.course,
      courseTitle: assignment?.course?.title,
      assignmentStatus: assignment?.status,
    });

    if (!assignment) {
      console.log('[Assignment API] Assignment not found', {
        assignmentId,
        userId,
        userRole,
        query,
      });
      return NextResponse.json(
        { message: 'Assignment not found or not accessible' },
        { status: 404 }
      );
    }

    if (!assignment.course) {
      console.log('[Assignment API] Course not found or not published', {
        assignmentId,
        userId,
        courseId: assignment.course,
      });
      return NextResponse.json(
        { message: 'Course not found or not published' },
        { status: 404 }
      );
    }

    console.log('[Assignment API] Assignment found successfully', {
      assignmentId,
      userId,
      userRole,
      courseId: assignment.course._id,
      courseTitle: assignment.course.title,
      assignmentStatus: assignment.status,
      companyId: assignment.companyId,
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('[Assignment API] Error occurred', {
      assignmentId,
      userId,
      userRole,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}
