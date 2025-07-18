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

  const { lessonId, quizResult } = await req.json();
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

  // Find the lesson progress entry
  const lessonProgress = assignment.lessonProgress.find(
    (lp: any) => lp.lessonId.toString() === lessonId
  );
  if (!lessonProgress) {
    return NextResponse.json(
      { message: 'Lesson progress not found' },
      { status: 404 }
    );
  }

  lessonProgress.status = 'completed';
  lessonProgress.completedAt = new Date();
  lessonProgress.quizResult = quizResult;

  await assignment.save();
  return NextResponse.json({
    message: 'Lesson marked as completed',
    lessonProgress,
  });
}
