import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
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

  try {
    console.log('[Assignment API] Request received', {
      assignmentId,
      userId,
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

    // Find the assignment and populate the course
    const assignment = await CourseAssignment.findOne({
      _id: new Types.ObjectId(assignmentId),
      employee: new Types.ObjectId(userId),
    }).populate({
      path: 'course',
      model: Course,
      match: { status: 'published' }, // Only allow published courses for employees
    });

    console.log('[Assignment API] Assignment query result', {
      assignmentId,
      userId,
      assignmentFound: !!assignment,
      hasCourse: !!assignment?.course,
      courseTitle: assignment?.course?.title,
      assignmentStatus: assignment?.status,
    });

    if (!assignment) {
      console.log('[Assignment API] Assignment not found', {
        assignmentId,
        userId,
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
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: 'Failed to fetch assignment' },
      { status: 500 }
    );
  }
}
