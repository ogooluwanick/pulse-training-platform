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

  const courseId = params.id;
  const userId = session.user.id;
  const { lessonId, quizResult } = await req.json();

  if (!lessonId) {
    return NextResponse.json(
      { message: 'Lesson ID is required' },
      { status: 400 }
    );
  }

  try {
    // Find or create the course assignment
    let assignment = await CourseAssignment.findOne({
      course: courseId,
      employee: userId,
    });

    if (!assignment) {
      // Create new assignment if it doesn't exist
      assignment = new CourseAssignment({
        course: courseId,
        employee: userId,
        status: 'in-progress',
        lessonProgress: [],
      });
    }

    // Check if lesson is already completed
    const existingLessonProgress = assignment.lessonProgress?.find(
      (lp: any) => lp.lessonId === lessonId
    );

    if (existingLessonProgress) {
      // Update existing lesson progress
      existingLessonProgress.status = 'completed';
      existingLessonProgress.completedAt = new Date();
      if (quizResult) {
        existingLessonProgress.quizResult = quizResult;
      }
    } else {
      // Add new lesson progress
      assignment.lessonProgress.push({
        lessonId,
        status: 'completed',
        completedAt: new Date(),
        quizResult: quizResult || null,
      });
    }

    // Check if all lessons are completed to update overall status
    const course = await import('@/lib/models/Course')
      .then((m) => m.default)
      .findById(courseId);
    if (course && course.lessons) {
      const totalLessons = course.lessons.length;
      const completedLessons =
        assignment.lessonProgress?.filter(
          (lp: any) => lp.status === 'completed'
        ).length || 0;

      if (completedLessons >= totalLessons) {
        assignment.status = 'completed';
        assignment.completedAt = new Date();
      } else if (assignment.status === 'not-started') {
        assignment.status = 'in-progress';
      }
    }

    await assignment.save();

    return NextResponse.json({
      message: 'Lesson completed successfully',
      assignment,
    });
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json(
      { message: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}
