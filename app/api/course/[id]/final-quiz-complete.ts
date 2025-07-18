import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { finalQuizResult } = await req.json();
  const courseId = params.id;
  const userId = session.user.id;

  // Find the assignment for this user and course
  const assignment = await CourseAssignment.findOne({
    course: courseId,
    employee: userId,
  });
  if (!assignment) {
    return NextResponse.json(
      { message: 'Assignment not found' },
      { status: 404 }
    );
  }

  assignment.status = 'completed';
  assignment.completedAt = new Date();
  assignment.finalQuizResult = finalQuizResult;

  await assignment.save();
  return NextResponse.json({
    message: 'Course marked as completed',
    assignment,
  });
}
