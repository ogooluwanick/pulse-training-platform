import {
  createInAppNotification,
  createCourseCompletionNotification,
  createCourseEnrollmentNotification,
  createDeadlineReminderNotification,
} from './notificationService';
import {
  createActivity,
  createEnrollmentActivity,
  createCompletionActivity,
  createDeadlineActivity,
} from './activityService';
import { sendEmail } from './email';

/**
 * Combined service for handling both notifications and activities
 * This service provides high-level functions for common platform events
 */

interface UserInfo {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyId?: string;
  activeCompanyId?: string;
}

interface CourseInfo {
  id: string;
  title: string;
}

/**
 * Handles course enrollment with both notification and activity creation
 * @param user - User information
 * @param course - Course information
 * @param sendEmailNotification - Whether to send email notification (default: false)
 * @returns Promise<{ notification: CreatedNotification | null, activity: CreatedActivity | null }>
 */
export const handleCourseEnrollment = async (
  user: UserInfo,
  course: CourseInfo,
  sendEmailNotification: boolean = false
) => {
  const results = {
    notification: null as any,
    activity: null as any,
    email: null as any,
  };

  try {
    // Create in-app notification
    results.notification = await createCourseEnrollmentNotification(
      user.id,
      course.title,
      course.id
    );

    // Create activity record
    results.activity = await createEnrollmentActivity(
      user.id,
      course.id,
      user.activeCompanyId || user.companyId
    );

    // Send email notification if requested
    if (sendEmailNotification && user.email) {
      const emailSubject = `Course Assigned: ${course.title}`;
      const emailText = `Hi ${user.firstName || 'there'},\n\nYou have been assigned to "${course.title}". Please log in to your dashboard to start learning.\n\nBest regards,\nThe Pulse Team`;

      results.email = await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });
    }

    console.log(
      `[NotificationActivityService] Course enrollment handled for user ${user.id} and course ${course.id}`
    );
    return results;
  } catch (error) {
    console.error(
      '[NotificationActivityService] Error handling course enrollment:',
      error
    );
    return results;
  }
};

/**
 * Handles course completion with both notification and activity creation
 * @param user - User information
 * @param course - Course information
 * @param sendEmailNotification - Whether to send email notification (default: false)
 * @returns Promise<{ notification: CreatedNotification | null, activity: CreatedActivity | null }>
 */
export const handleCourseCompletion = async (
  user: UserInfo,
  course: CourseInfo,
  sendEmailNotification: boolean = false
) => {
  const results = {
    notification: null as any,
    activity: null as any,
    email: null as any,
  };

  try {
    // Create in-app notification
    results.notification = await createCourseCompletionNotification(
      user.id,
      course.title,
      course.id
    );

    // Create activity record
    results.activity = await createCompletionActivity(
      user.id,
      course.id,
      user.activeCompanyId || user.companyId
    );

    // Send email notification if requested
    if (sendEmailNotification && user.email) {
      const emailSubject = `Congratulations! Course Completed: ${course.title}`;
      const emailText = `Hi ${user.firstName || 'there'},\n\nCongratulations! You have successfully completed "${course.title}".\n\nKeep up the great work!\n\nBest regards,\nThe Pulse Team`;

      results.email = await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });
    }

    console.log(
      `[NotificationActivityService] Course completion handled for user ${user.id} and course ${course.id}`
    );
    return results;
  } catch (error) {
    console.error(
      '[NotificationActivityService] Error handling course completion:',
      error
    );
    return results;
  }
};

/**
 * Handles deadline reminder with both notification and activity creation
 * @param user - User information
 * @param course - Course information
 * @param daysLeft - Number of days left to complete
 * @param sendEmailNotification - Whether to send email notification (default: true)
 * @returns Promise<{ notification: CreatedNotification | null, activity: CreatedActivity | null }>
 */
export const handleDeadlineReminder = async (
  user: UserInfo,
  course: CourseInfo,
  daysLeft: number,
  sendEmailNotification: boolean = true
) => {
  const results = {
    notification: null as any,
    activity: null as any,
    email: null as any,
  };

  try {
    // Create in-app notification
    results.notification = await createDeadlineReminderNotification(
      user.id,
      course.title,
      course.id,
      daysLeft
    );

    // Create activity record
    results.activity = await createDeadlineActivity(
      user.id,
      course.id,
      user.activeCompanyId || user.companyId
    );

    // Send email notification if requested
    if (sendEmailNotification && user.email) {
      const urgency =
        daysLeft === 1 ? 'URGENT' : daysLeft <= 3 ? 'Important' : 'Reminder';
      const emailSubject = `${urgency}: Course Deadline - ${course.title}`;
      const emailText = `Hi ${user.firstName || 'there'},\n\nYou have ${daysLeft} day${daysLeft === 1 ? '' : 's'} left to complete "${course.title}".\n\nPlease log in to your dashboard to continue your learning.\n\nBest regards,\nThe Pulse Team`;

      results.email = await sendEmail({
        to: user.email,
        subject: emailSubject,
        text: emailText,
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });
    }

    console.log(
      `[NotificationActivityService] Deadline reminder handled for user ${user.id} and course ${course.id} (${daysLeft} days left)`
    );
    return results;
  } catch (error) {
    console.error(
      '[NotificationActivityService] Error handling deadline reminder:',
      error
    );
    return results;
  }
};

/**
 * Handles bulk course assignments with notifications and activities
 * @param users - Array of user information
 * @param course - Course information
 * @param sendEmailNotifications - Whether to send email notifications (default: false)
 * @returns Promise<{ notifications: CreatedNotification[], activities: CreatedActivity[], emails: any[] }>
 */
export const handleBulkCourseAssignment = async (
  users: UserInfo[],
  course: CourseInfo,
  sendEmailNotifications: boolean = false
) => {
  const results = {
    notifications: [] as any[],
    activities: [] as any[],
    emails: [] as any[],
  };

  try {
    // Process each user
    for (const user of users) {
      const userResult = await handleCourseEnrollment(
        user,
        course,
        sendEmailNotifications
      );

      if (userResult.notification) {
        results.notifications.push(userResult.notification);
      }

      if (userResult.activity) {
        results.activities.push(userResult.activity);
      }

      if (userResult.email) {
        results.emails.push(userResult.email);
      }
    }

    console.log(
      `[NotificationActivityService] Bulk course assignment handled for ${users.length} users and course ${course.id}`
    );
    return results;
  } catch (error) {
    console.error(
      '[NotificationActivityService] Error handling bulk course assignment:',
      error
    );
    return results;
  }
};

/**
 * Creates a system notification for admin/company users
 * @param user - User information
 * @param title - Notification title
 * @param message - Notification message
 * @param level - Notification level
 * @param deepLink - Optional deep link
 * @param type - Optional notification type
 * @returns Promise<CreatedNotification | null>
 */
export const createSystemNotification = async (
  user: UserInfo,
  title: string,
  message: string,
  level: 'info' | 'success' | 'warning' | 'error' = 'info',
  deepLink?: string,
  type?: string
) => {
  return createInAppNotification({
    userId: user.id,
    title,
    message,
    level,
    deepLink,
    type: type || 'system',
  });
};

/**
 * Creates a welcome notification for new users
 * @param user - User information
 * @returns Promise<CreatedNotification | null>
 */
export const createWelcomeNotification = async (user: UserInfo) => {
  return createInAppNotification({
    userId: user.id,
    title: 'Welcome to Pulse! 🎉',
    message: `Hi ${user.firstName || 'there'}! Welcome to Pulse. We're excited to have you on board. Start exploring your dashboard to begin your learning journey.`,
    level: 'success',
    deepLink: '/dashboard',
    type: 'welcome',
  });
};

/**
 * Creates a password reset notification
 * @param user - User information
 * @returns Promise<CreatedNotification | null>
 */
export const createPasswordResetNotification = async (user: UserInfo) => {
  return createInAppNotification({
    userId: user.id,
    title: 'Password Reset Requested 🔐',
    message:
      'Your password reset request has been processed. Check your email for further instructions.',
    level: 'info',
    deepLink: '/auth/signin',
    type: 'password_reset',
  });
};
