import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createEnrollmentActivity } from '@/lib/activityService';
import { createInfoNotification } from '@/lib/notificationService';
import Course from '@/lib/models/Course';
import { Types } from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const assignmentId = params.assignmentId;
  const userId = session.user.id;
  const requestBody = await req.json();
  const { lessonId, quizResult } = requestBody;

  console.log('[Assignment Lesson Complete API] Request received:', {
    assignmentId,
    userId,
    lessonId,
    hasQuizResult: !!quizResult,
    timestamp: new Date().toISOString(),
  });

  if (!lessonId) {
    console.log('[Assignment Lesson Complete API] Lesson ID is missing!');
    return NextResponse.json(
      { message: 'Lesson ID is required' },
      { status: 400 }
    );
  }

  try {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(assignmentId)) {
      console.error('[Assignment Lesson Complete API] Invalid assignment ID format:', assignmentId);
      return NextResponse.json(
        { message: 'Invalid assignment ID format' },
        { status: 400 }
      );
    }

    // Find the assignment for this user
    const assignment = await CourseAssignment.findOne({
      _id: new Types.ObjectId(assignmentId),
      employee: new Types.ObjectId(userId),
    });

    if (!assignment) {
      console.log('[Assignment Lesson Complete API] Assignment not found:', {
        assignmentId,
        userId,
      });
      return NextResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    console.log('[Assignment Lesson Complete API] Assignment found:', {
      assignmentId,
      userId,
      courseId: assignment.course,
      assignmentStatus: assignment.status,
      currentLessonProgressCount: assignment.lessonProgress?.length || 0,
    });

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
      console.log('[Assignment Lesson Complete API] Updated existing lesson progress');
    } else {
      // Add new lesson progress
      assignment.lessonProgress.push({
        lessonId,
        status: 'completed',
        completedAt: new Date(),
        quizResult: quizResult || null,
      });
      console.log('[Assignment Lesson Complete API] Added new lesson progress');
    }

    // Check if all lessons are completed to update overall status
    const course = await Course.findById(assignment.course);

    if (course && course.lessons) {
      const totalLessons = course.lessons.length;
      const completedLessons =
        assignment.lessonProgress?.filter(
          (lp: any) => lp.status === 'completed'
        ).length || 0;

      // Calculate and update progress percentage
      const progressPercentage = Math.round((completedLessons / totalLessons) * 100);
      assignment.progress = progressPercentage;

      // Update assignment status based on completion
      if (completedLessons === totalLessons) {
        assignment.status = 'completed';
        assignment.completedAt = new Date();
        console.log('[Assignment Lesson Complete API] Course completed!');
      } else if (assignment.status === 'not-started') {
        assignment.status = 'in-progress';
        console.log('[Assignment Lesson Complete API] Course status updated to in-progress');
      }

      console.log('[Assignment Lesson Complete API] Progress updated:', {
        completedLessons,
        totalLessons,
        progressPercentage,
        newStatus: assignment.status,
      });
    }

    // Save the assignment
    await assignment.save();

    console.log('[Assignment Lesson Complete API] Assignment saved successfully');

    // Create activity record
    try {
      await createEnrollmentActivity(
        userId,
        assignment.course.toString(),
        'lesson_completed',
        `Completed lesson in ${course?.title || 'course'}`
      );
    } catch (activityError) {
      console.error('[Assignment Lesson Complete API] Error creating activity:', activityError);
    }

    // Create notification
    try {
      await createInfoNotification(
        userId,
        'Lesson Completed! 📚',
        `Great job! You've completed a lesson in ${course?.title || 'your course'}.`,
        `/dashboard/assignment/${assignmentId}`,
        'lesson_completion'
      );
    } catch (notificationError) {
      console.error('[Assignment Lesson Complete API] Error creating notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Lesson completed successfully',
      progress: assignment.progress,
      status: assignment.status,
      completedLessons: assignment.lessonProgress?.filter((lp: any) => lp.status === 'completed').length || 0,
    });
  } catch (error) {
    console.error('[Assignment Lesson Complete API] Error completing lesson:', error);
    return NextResponse.json(
      { message: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}
