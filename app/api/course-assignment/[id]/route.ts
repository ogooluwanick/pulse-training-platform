import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
    // Find the assignment for this user and course
    const assignment = await CourseAssignment.findOne({
      course: courseId,
      employee: userId,
    }).populate('course', 'title description lessons');

    if (!assignment) {
      // Return empty assignment data if no assignment exists
      return NextResponse.json({
        _id: null,
        course: courseId,
        employee: userId,
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
    // Check if assignment already exists
    const existingAssignment = await CourseAssignment.findOne({
      course: courseId,
      employee: userId,
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
