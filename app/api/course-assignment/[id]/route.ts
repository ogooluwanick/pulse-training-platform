import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Types } from 'mongoose';
import Course from '@/lib/models/Course';
import { requireCompanyContext } from '@/lib/user-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  const userId = session.user.id;

  try {
    console.log(
      'Course Assignment API - Course ID:',
      courseId,
      'User ID:',
      userId
    );

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(courseId)) {
      console.error('Invalid course ID format:', courseId);
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Resolve active company context (supports header/cookie/session)
    const activeCompanyId = await requireCompanyContext(session);

    // Find the assignment for this user, course, and company
    const assignment = await CourseAssignment.findOne({
      course: new Types.ObjectId(courseId),
      employee: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(activeCompanyId),
    }).populate({
      path: 'course',
      model: Course,
      select: 'title description lessons finalQuiz',
      match: {}, // No status filter for course assignments
    });

    console.log('Assignment found:', assignment ? 'YES' : 'NO');

    if (!assignment) {
      // Return empty assignment data if no assignment exists
      return NextResponse.json({
        _id: null,
        course: courseId,
        employee: userId,
        companyId: activeCompanyId,
        status: 'not-started',
        lessonProgress: [],
        assignmentType: 'one-time',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching course assignment:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course assignment' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const courseId = params.id;
  const userId = session.user.id;
  const { assignmentType, interval, endDate } = await req.json();

  try {
    const activeCompanyId = await requireCompanyContext(session);
    // Check if assignment already exists
    const existingAssignment = await CourseAssignment.findOne({
      course: new Types.ObjectId(courseId),
      employee: new Types.ObjectId(userId),
      companyId: new Types.ObjectId(activeCompanyId),
    });

    if (existingAssignment) {
      return NextResponse.json(
        { message: 'Assignment already exists' },
        { status: 409 }
      );
    }

    // Create new assignment
    const assignment = new CourseAssignment({
      course: courseId,
      employee: userId,
      companyId: activeCompanyId,
      assignmentType: assignmentType || 'one-time',
      interval: interval || undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'not-started',
      lessonProgress: [],
    });

    await assignment.save();

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error creating course assignment:', error);
    return NextResponse.json(
      { message: 'Failed to create course assignment' },
      { status: 500 }
    );
  }
}
