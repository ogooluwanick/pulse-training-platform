import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {
  handleCourseEnrollment,
  handleCourseCompletion,
  createWelcomeNotification,
} from '@/lib/notificationActivityService';
import {
  createInAppNotification,
  createSuccessNotification,
} from '@/lib/notificationService';
import {
  createActivity,
  createEnrollmentActivity,
} from '@/lib/activityService';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';

/**
 * Example API route demonstrating the notification and activity services
 * This is for demonstration purposes - not for production use
 */
export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, userId, courseId, sendEmail } = await request.json();

    // Validate required fields
    if (!action || !userId || !courseId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: action, userId, courseId',
        },
        { status: 400 }
      );
    }

    // Fetch user and course data
    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const userInfo = {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId?.toString(),
      activeCompanyId: session.user.activeCompanyId,
    };

    const courseInfo = {
      id: course._id.toString(),
      title: course.title,
    };

    let result: any = {};

    switch (action) {
      case 'enrollment':
        // Example 1: Using the combined service for course enrollment
        result = await handleCourseEnrollment(
          userInfo,
          courseInfo,
          sendEmail || false
        );
        break;

      case 'completion':
        // Example 2: Using the combined service for course completion
        result = await handleCourseCompletion(
          userInfo,
          courseInfo,
          sendEmail || false
        );
        break;

      case 'welcome':
        // Example 3: Creating a welcome notification
        result.notification = await createWelcomeNotification(userInfo);
        break;

      case 'custom':
        // Example 4: Using individual services
        const notification = await createSuccessNotification(
          userInfo.id,
          'Custom Success',
          'This is a custom success notification',
          '/dashboard',
          'custom'
        );

        const activity = await createEnrollmentActivity(
          userInfo.id,
          courseInfo.id,
          userInfo.activeCompanyId || userInfo.companyId
        );

        result = { notification, activity };
        break;

      case 'batch':
        // Example 5: Batch operations
        const notifications = await createInAppNotification([
          {
            userId: userInfo.id,
            title: 'Batch Notification 1',
            message: 'First notification in batch',
            level: 'info',
            type: 'batch',
          },
          {
            userId: userInfo.id,
            title: 'Batch Notification 2',
            message: 'Second notification in batch',
            level: 'success',
            type: 'batch',
          },
        ]);

        const activities = await createActivity([
          {
            userId: userInfo.id,
            type: 'enrollment',
            courseId: courseInfo.id,
            companyId: userInfo.activeCompanyId || userInfo.companyId,
          },
          {
            userId: userInfo.id,
            type: 'completion',
            courseId: courseInfo.id,
            companyId: userInfo.activeCompanyId || userInfo.companyId,
          },
        ]);

        result = { notifications, activities };
        break;

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Valid actions: enrollment, completion, welcome, custom, batch',
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      message: `Successfully executed ${action} action`,
    });
  } catch (error) {
    console.error('[Example API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to demonstrate different notification types
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'info';

    // Create a demo notification based on type
    const notification = await createInAppNotification({
      userId: session.user.id,
      title: `Demo ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`,
      message: `This is a demo ${type} notification created at ${new Date().toLocaleString()}`,
      level: type as 'info' | 'success' | 'warning' | 'error',
      deepLink: '/dashboard',
      type: 'demo',
    });

    return NextResponse.json({
      success: true,
      notification,
      message: `Demo ${type} notification created successfully`,
    });
  } catch (error) {
    console.error('[Example API] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
