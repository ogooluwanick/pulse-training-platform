import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createEnrollmentActivity } from '@/lib/activityService';
import { createSuccessNotification } from '@/lib/notificationService';
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
  const { finalQuizResult } = await req.json();

  console.log('[Assignment Final Quiz Complete API] Request received:', {
    assignmentId,
    userId,
    hasFinalQuizResult: !!finalQuizResult,
    timestamp: new Date().toISOString(),
  });

  if (!finalQuizResult) {
    console.log('[Assignment Final Quiz Complete API] Final quiz result is missing!');
    return NextResponse.json(
      { message: 'Final quiz result is required' },
      { status: 400 }
    );
  }

  try {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(assignmentId)) {
      console.error('[Assignment Final Quiz Complete API] Invalid assignment ID format:', assignmentId);
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
      console.log('[Assignment Final Quiz Complete API] Assignment not found:', {
        assignmentId,
        userId,
      });
      return NextResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    console.log('[Assignment Final Quiz Complete API] Assignment found:', {
      assignmentId,
      userId,
      courseId: assignment.course,
      assignmentStatus: assignment.status,
    });

    // Get course details for validation
    const course = await Course.findById(assignment.course);
    if (!course) {
      console.log('[Assignment Final Quiz Complete API] Course not found:', assignment.course);
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if course has a final quiz
    if (!course.finalQuiz) {
      console.log('[Assignment Final Quiz Complete API] Course has no final quiz');
      return NextResponse.json(
        { message: 'Course has no final quiz' },
        { status: 400 }
      );
    }

    // Update assignment with final quiz result
    assignment.finalQuizResult = finalQuizResult;
    assignment.status = 'completed';
    assignment.completedAt = new Date();
    assignment.progress = 100;

    // Save the assignment
    await assignment.save();

    console.log('[Assignment Final Quiz Complete API] Assignment completed successfully');

    // Create activity record
    try {
      await createEnrollmentActivity(
        userId,
        assignment.course.toString(),
        'course_completed',
        `Completed course: ${course.title}`
      );
    } catch (activityError) {
      console.error('[Assignment Final Quiz Complete API] Error creating activity:', activityError);
    }

    // Create success notification
    try {
      await createSuccessNotification(
        userId,
        'Course Completed! 🎉',
        `Congratulations! You have successfully completed "${course.title}".`,
        `/dashboard/assignment/${assignmentId}`
      );
    } catch (notificationError) {
      console.error('[Assignment Final Quiz Complete API] Error creating notification:', notificationError);
    }

    return NextResponse.json({
      success: true,
      message: 'Course completed successfully',
      finalQuizResult: assignment.finalQuizResult,
      status: assignment.status,
      completedAt: assignment.completedAt,
    });
  } catch (error) {
    console.error('[Assignment Final Quiz Complete API] Error completing course:', error);
    return NextResponse.json(
      { message: 'Failed to complete course' },
      { status: 500 }
    );
  }
}
