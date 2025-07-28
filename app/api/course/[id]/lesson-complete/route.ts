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
  const requestBody = await req.json();
  const { lessonId, quizResult } = requestBody;

  console.log('API received request body:', requestBody);
  console.log('Extracted lessonId:', lessonId);
  console.log('Extracted quizResult:', quizResult);
  console.log('courseId from params:', courseId);
  console.log('userId from session:', userId);

  if (!lessonId) {
    console.log('Lesson ID is missing!');
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
    const existingLessonIndex = assignment.lessonProgress?.findIndex(
      (lp: any) => lp.lessonId.toString() === lessonId
    );

    if (existingLessonIndex !== -1) {
      // Update existing lesson progress - REPLACE the quiz result, don't add multiple
      assignment.lessonProgress[existingLessonIndex].status = 'completed';
      assignment.lessonProgress[existingLessonIndex].completedAt = new Date();
      if (quizResult) {
        // Replace the quiz result instead of adding multiple attempts
        assignment.lessonProgress[existingLessonIndex].quizResult = quizResult;
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
    const CourseModel = await import('@/lib/models/Course').then(
      (m) => m.default
    );
    const course = await CourseModel.findById(courseId);

    if (course && course.lessons) {
      const totalLessons = course.lessons.length;
      const completedLessons =
        assignment.lessonProgress?.filter(
          (lp: any) => lp.status === 'completed'
        ).length || 0;

      // Only mark as completed if ALL lessons are done AND final quiz is passed (if exists)
      if (completedLessons >= totalLessons) {
        // Check if there's a final quiz and if it's been passed
        if (course.finalQuiz) {
          // Course is only complete if final quiz is also passed
          if (assignment.finalQuizResult?.passed) {
            assignment.status = 'completed';
            assignment.completedAt = new Date();
          } else {
            // All lessons done but final quiz not passed yet
            assignment.status = 'in-progress';
          }
        } else {
          // No final quiz, mark as completed
          assignment.status = 'completed';
          assignment.completedAt = new Date();
        }
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
