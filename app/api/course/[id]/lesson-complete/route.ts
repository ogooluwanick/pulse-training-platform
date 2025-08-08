import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createEnrollmentActivity } from '@/lib/activityService';
import { createInfoNotification } from '@/lib/notificationService';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import { requireCompanyContext } from '@/lib/user-utils';

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
    // Resolve active company context first
    const activeCompanyId = await requireCompanyContext(session);

    // Find or create the course assignment scoped to company
    let assignment = await CourseAssignment.findOne({
      course: courseId,
      employee: userId,
      companyId: activeCompanyId,
    });

    if (!assignment) {
      // Create new assignment if it doesn't exist
      assignment = new CourseAssignment({
        course: courseId,
        employee: userId,
        companyId: activeCompanyId,
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

      // Calculate and update progress percentage
      const progressPercentage =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
      assignment.progress = progressPercentage;

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

    // Create activity and notification for lesson completion
    try {
      // Get user and course info for notifications
      const user = await User.findById(userId);
      const courseData = await Course.findById(courseId);

      if (user && courseData) {
        // Create activity for lesson completion
        await createEnrollmentActivity(userId, courseId, activeCompanyId);

        // Create notification for lesson completion
        await createInfoNotification(
          userId,
          'Lesson Completed! 📚',
          `Great job! You've completed a lesson in "${courseData.title}". Keep up the good work!`,
          `/dashboard/course/${courseId}`,
          'lesson_completion'
        );

        console.log(
          `[Lesson Complete] Activity and notification created for user ${userId} and course ${courseId}`
        );
      }
    } catch (error) {
      console.error(
        '[Lesson Complete] Error creating activity/notification:',
        error
      );
      // Don't fail the main request if notification/activity creation fails
    }

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
