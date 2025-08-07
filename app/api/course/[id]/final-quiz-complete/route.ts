import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';
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

  // Only mark as completed if all lessons are also completed
  const CourseModel = await import('@/lib/models/Course').then(
    (m) => m.default
  );
  const course = await CourseModel.findById(courseId);

  if (course && course.lessons) {
    const totalLessons = course.lessons.length;
    const completedLessons =
      assignment.lessonProgress?.filter((lp: any) => lp.status === 'completed')
        .length || 0;

    // Calculate and update progress percentage
    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : 0;
    assignment.progress = progressPercentage;

    if (completedLessons >= totalLessons) {
      assignment.status = 'completed';
      assignment.completedAt = new Date();
    }
  }

  assignment.finalQuizResult = finalQuizResult;

  await assignment.save();

  // Check if user has already rated this course
  // const courseData = await Course.findById(courseId);
  // const hasRated =
  //   courseData?.rating.some((r: any) => r.user.toString() === userId) || false;

  return NextResponse.json({
    message: 'Course marked as completed',
    assignment,
    // shouldPromptRating: !hasRated, // Only prompt if user hasn't rated yet
  });
}
