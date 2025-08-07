import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define structure for inserting a new notification
// Matches NotificationInsertData from app/api/notifications/create/route.ts
export interface NotificationInsertData {
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: Date;
  isRead: boolean;
  type?: string;
}

// Define structure for the created notification, similar to ClientNotification
export interface CreatedNotification {
  _id: string; // ObjectId as string
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: string; // Date as ISO string
  isRead: boolean;
  type?: string;
}

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  type?: string;
}

/**
 * Creates a new in-app notification
 * @param params - Notification creation parameters
 * @returns Promise<CreatedNotification | null> - The created notification or null if failed
 */
export const createInAppNotification = async ({
  userId,
  title,
  message,
  level,
  deepLink,
  type,
}: CreateNotificationParams): Promise<CreatedNotification | null> => {
  // Basic validation
  if (!userId || !title || !message || !level) {
    console.error(
      '[NotificationService] Missing required fields for notification.'
    );
    return null;
  }

  if (!['info', 'success', 'warning', 'error'].includes(level)) {
    console.error(
      '[NotificationService] Invalid level value for notification.'
    );
    return null;
  }

  // Validate ObjectId format
  if (!ObjectId.isValid(userId)) {
    console.error('[NotificationService] Invalid userId format.');
    return null;
  }

  try {
    const mongoClient = await clientPromise();
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications');

    const notificationToInsert: NotificationInsertData = {
      userId,
      title,
      message,
      level,
      deepLink: deepLink || undefined,
      createdAt: new Date(),
      isRead: false,
      type: type || 'general',
    };

    const insertResult =
      await notificationsCollection.insertOne(notificationToInsert);

    if (!insertResult.insertedId) {
      console.error(
        '[NotificationService] Failed to insert notification, no insertedId returned.'
      );
      return null;
    }

    const createdNotification: CreatedNotification = {
      _id: insertResult.insertedId.toString(),
      userId: notificationToInsert.userId,
      title: notificationToInsert.title,
      message: notificationToInsert.message,
      level: notificationToInsert.level,
      deepLink: notificationToInsert.deepLink,
      createdAt: notificationToInsert.createdAt.toISOString(),
      isRead: notificationToInsert.isRead,
      type: notificationToInsert.type,
    };

    console.log(
      `[NotificationService] Notification for ${userId} stored in DB with ID: ${insertResult.insertedId.toString()}.`
    );
    return createdNotification;
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error);
    return null;
  }
};

/**
 * Creates multiple notifications in batch
 * @param notifications - Array of notification creation parameters
 * @returns Promise<CreatedNotification[]> - Array of created notifications
 */
export const createInAppNotifications = async (
  notifications: CreateNotificationParams[]
): Promise<CreatedNotification[]> => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    console.error(
      '[NotificationService] No notifications provided for batch creation.'
    );
    return [];
  }

  try {
    const mongoClient = await clientPromise();
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications');

    const validNotifications = notifications.filter((notification) => {
      if (
        !notification.userId ||
        !notification.title ||
        !notification.message ||
        !notification.level
      ) {
        console.warn(
          '[NotificationService] Skipping notification with missing required fields:',
          notification
        );
        return false;
      }

      if (
        !['info', 'success', 'warning', 'error'].includes(notification.level)
      ) {
        console.warn(
          '[NotificationService] Skipping notification with invalid level:',
          notification
        );
        return false;
      }

      if (!ObjectId.isValid(notification.userId)) {
        console.warn(
          '[NotificationService] Skipping notification with invalid userId format:',
          notification
        );
        return false;
      }

      return true;
    });

    if (validNotifications.length === 0) {
      console.error('[NotificationService] No valid notifications to create.');
      return [];
    }

    const notificationsToInsert = validNotifications.map((notification) => ({
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      level: notification.level,
      deepLink: notification.deepLink || undefined,
      createdAt: new Date(),
      isRead: false,
      type: notification.type || 'general',
    }));

    const insertResult = await notificationsCollection.insertMany(
      notificationsToInsert
    );

    const createdNotifications: CreatedNotification[] =
      insertResult.insertedIds.map((id, index) => ({
        _id: id.toString(),
        userId: notificationsToInsert[index].userId,
        title: notificationsToInsert[index].title,
        message: notificationsToInsert[index].message,
        level: notificationsToInsert[index].level,
        deepLink: notificationsToInsert[index].deepLink,
        createdAt: notificationsToInsert[index].createdAt.toISOString(),
        isRead: notificationsToInsert[index].isRead,
        type: notificationsToInsert[index].type,
      }));

    console.log(
      `[NotificationService] Created ${createdNotifications.length} notifications in batch.`
    );
    return createdNotifications;
  } catch (error) {
    console.error(
      '[NotificationService] Error creating notifications in batch:',
      error
    );
    return [];
  }
};

/**
 * Creates a success notification
 * @param userId - User ID
 * @param title - Notification title
 * @param message - Notification message
 * @param deepLink - Optional deep link
 * @param type - Optional notification type
 * @returns Promise<CreatedNotification | null>
 */
export const createSuccessNotification = async (
  userId: string,
  title: string,
  message: string,
  deepLink?: string,
  type?: string
): Promise<CreatedNotification | null> => {
  return createInAppNotification({
    userId,
    title,
    message,
    level: 'success',
    deepLink,
    type,
  });
};

/**
 * Creates an error notification
 * @param userId - User ID
 * @param title - Notification title
 * @param message - Notification message
 * @param deepLink - Optional deep link
 * @param type - Optional notification type
 * @returns Promise<CreatedNotification | null>
 */
export const createErrorNotification = async (
  userId: string,
  title: string,
  message: string,
  deepLink?: string,
  type?: string
): Promise<CreatedNotification | null> => {
  return createInAppNotification({
    userId,
    title,
    message,
    level: 'error',
    deepLink,
    type,
  });
};

/**
 * Creates a warning notification
 * @param userId - User ID
 * @param title - Notification title
 * @param message - Notification message
 * @param deepLink - Optional deep link
 * @param type - Optional notification type
 * @returns Promise<CreatedNotification | null>
 */
export const createWarningNotification = async (
  userId: string,
  title: string,
  message: string,
  deepLink?: string,
  type?: string
): Promise<CreatedNotification | null> => {
  return createInAppNotification({
    userId,
    title,
    message,
    level: 'warning',
    deepLink,
    type,
  });
};

/**
 * Creates an info notification
 * @param userId - User ID
 * @param title - Notification title
 * @param message - Notification message
 * @param deepLink - Optional deep link
 * @param type - Optional notification type
 * @returns Promise<CreatedNotification | null>
 */
export const createInfoNotification = async (
  userId: string,
  title: string,
  message: string,
  deepLink?: string,
  type?: string
): Promise<CreatedNotification | null> => {
  return createInAppNotification({
    userId,
    title,
    message,
    level: 'info',
    deepLink,
    type,
  });
};

/**
 * Creates a course completion notification
 * @param userId - User ID
 * @param courseTitle - Course title
 * @param courseId - Course ID for deep link
 * @returns Promise<CreatedNotification | null>
 */
export const createCourseCompletionNotification = async (
  userId: string,
  courseTitle: string,
  courseId: string
): Promise<CreatedNotification | null> => {
  return createSuccessNotification(
    userId,
    'Course Completed! 🎉',
    `Congratulations! You have successfully completed "${courseTitle}".`,
    `/dashboard/course/view/${courseId}`,
    'course_completion'
  );
};

/**
 * Creates a course enrollment notification
 * @param userId - User ID
 * @param courseTitle - Course title
 * @param courseId - Course ID for deep link
 * @returns Promise<CreatedNotification | null>
 */
export const createCourseEnrollmentNotification = async (
  userId: string,
  courseTitle: string,
  courseId: string
): Promise<CreatedNotification | null> => {
  return createInfoNotification(
    userId,
    'Course Assigned 📚',
    `You have been assigned to "${courseTitle}". Start learning now!`,
    `/dashboard/course/view/${courseId}`,
    'course_enrollment'
  );
};

/**
 * Creates a deadline reminder notification
 * @param userId - User ID
 * @param courseTitle - Course title
 * @param courseId - Course ID for deep link
 * @param daysLeft - Number of days left
 * @returns Promise<CreatedNotification | null>
 */
export const createDeadlineReminderNotification = async (
  userId: string,
  courseTitle: string,
  courseId: string,
  daysLeft: number
): Promise<CreatedNotification | null> => {
  const message =
    daysLeft === 1
      ? `You have 1 day left to complete "${courseTitle}".`
      : `You have ${daysLeft} days left to complete "${courseTitle}".`;

  return createWarningNotification(
    userId,
    'Deadline Reminder ⏰',
    message,
    `/dashboard/course/view/${courseId}`,
    'deadline_reminder'
  );
};
