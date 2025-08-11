import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Types } from 'mongoose';
import { resolveCompanyIdFromRequest } from '@/lib/user-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.log('[Course Redirect API] No session found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  const userId = session.user.id;

  try {
    console.log('[Course Redirect API] Request received', {
      courseId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(courseId)) {
      console.error(
        '[Course Redirect API] Invalid course ID format:',
        courseId
      );
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Get company context for employees to find the right assignment
    let activeCompanyId: string | null = null;
    if (session.user.role === 'EMPLOYEE') {
      const resolvedCompanyId = resolveCompanyIdFromRequest(req, session);
      activeCompanyId = resolvedCompanyId || null;

      console.log('[Course Redirect API] Company context for employee', {
        userId,
        activeCompanyId,
        courseId,
      });
    }

    // Find the user's assignment for this course
    const query: any = {
      course: new Types.ObjectId(courseId),
      employee: new Types.ObjectId(userId),
    };

    // If we have company context, include it in the query
    if (activeCompanyId) {
      query.companyId = new Types.ObjectId(activeCompanyId);
    }

    const assignment = await CourseAssignment.findOne(query);

    console.log('[Course Redirect API] Assignment search result', {
      courseId,
      userId,
      activeCompanyId,
      assignmentFound: !!assignment,
      assignmentId: assignment?._id,
    });

    if (!assignment) {
      console.log('[Course Redirect API] No assignment found', {
        courseId,
        userId,
        activeCompanyId,
      });
      return NextResponse.json(
        { message: 'No assignment found for this course' },
        { status: 404 }
      );
    }

    console.log('[Course Redirect API] Redirecting to assignment', {
      courseId,
      userId,
      assignmentId: assignment._id,
    });

    // Return the assignment ID for redirect
    return NextResponse.json({
      assignmentId: assignment._id.toString(),
      redirectUrl: `/dashboard/assignment/${assignment._id}`,
    });
  } catch (error) {
    console.error('[Course Redirect API] Error occurred', {
      courseId,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: 'Failed to find assignment' },
      { status: 500 }
    );
  }
}
