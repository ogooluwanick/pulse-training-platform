import dbConnect from '@/lib/dbConnect';
import Activity from '@/lib/models/Activity';
import { Types } from 'mongoose';

// Define structure for creating a new activity
export interface ActivityInsertData {
  companyId?: string;
  userId: string;
  type: 'enrollment' | 'completion' | 'deadline';
  courseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define structure for the created activity
export interface CreatedActivity {
  _id: string;
  companyId?: string;
  userId: string;
  type: 'enrollment' | 'completion' | 'deadline';
  courseId?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateActivityParams {
  companyId?: string;
  userId: string;
  type: 'enrollment' | 'completion' | 'deadline';
  courseId?: string;
}

/**
 * Creates a new activity record in the database
 * @param params - Activity creation parameters
 * @returns Promise<CreatedActivity | null> - The created activity or null if failed
 */
export const createActivity = async ({
  companyId,
  userId,
  type,
  courseId,
}: CreateActivityParams): Promise<CreatedActivity | null> => {
  // Basic validation
  if (!userId || !type) {
    console.error('[ActivityService] Missing required fields for activity.');
    return null;
  }

  if (!['enrollment', 'completion', 'deadline'].includes(type)) {
    console.error('[ActivityService] Invalid type value for activity.');
    return null;
  }

  try {
    await dbConnect();

    // Validate ObjectId formats
    if (userId && !Types.ObjectId.isValid(userId)) {
      console.error('[ActivityService] Invalid userId format.');
      return null;
    }

    if (companyId && !Types.ObjectId.isValid(companyId)) {
      console.error('[ActivityService] Invalid companyId format.');
      return null;
    }

    if (courseId && !Types.ObjectId.isValid(courseId)) {
      console.error('[ActivityService] Invalid courseId format.');
      return null;
    }

    const activityToInsert: ActivityInsertData = {
      companyId: companyId || undefined,
      userId,
      type,
      courseId: courseId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const newActivity = new Activity(activityToInsert);
    const savedActivity = await newActivity.save();

    if (!savedActivity._id) {
      console.error(
        '[ActivityService] Failed to save activity, no _id returned.'
      );
      return null;
    }

    const createdActivity: CreatedActivity = {
      _id: savedActivity._id.toString(),
      companyId: savedActivity.companyId?.toString(),
      userId: savedActivity.userId.toString(),
      type: savedActivity.type,
      courseId: savedActivity.courseId?.toString(),
      createdAt: savedActivity.createdAt.toISOString(),
      updatedAt: savedActivity.updatedAt.toISOString(),
    };

    console.log(
      `[ActivityService] Activity for user ${userId} stored in DB with ID: ${savedActivity._id.toString()}.`
    );
    return createdActivity;
  } catch (error) {
    console.error('[ActivityService] Error creating activity:', error);
    return null;
  }
};

/**
 * Creates multiple activity records in batch
 * @param activities - Array of activity creation parameters
 * @returns Promise<CreatedActivity[]> - Array of created activities
 */
export const createActivities = async (
  activities: CreateActivityParams[]
): Promise<CreatedActivity[]> => {
  if (!Array.isArray(activities) || activities.length === 0) {
    console.error(
      '[ActivityService] No activities provided for batch creation.'
    );
    return [];
  }

  try {
    await dbConnect();

    const validActivities = activities.filter((activity) => {
      if (!activity.userId || !activity.type) {
        console.warn(
          '[ActivityService] Skipping activity with missing required fields:',
          activity
        );
        return false;
      }

      if (!['enrollment', 'completion', 'deadline'].includes(activity.type)) {
        console.warn(
          '[ActivityService] Skipping activity with invalid type:',
          activity
        );
        return false;
      }

      return true;
    });

    if (validActivities.length === 0) {
      console.error('[ActivityService] No valid activities to create.');
      return [];
    }

    const activitiesToInsert = validActivities.map((activity) => ({
      companyId: activity.companyId || undefined,
      userId: activity.userId,
      type: activity.type,
      courseId: activity.courseId || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const savedActivities = await Activity.insertMany(activitiesToInsert);

    const createdActivities: CreatedActivity[] = savedActivities.map(
      (activity) => ({
        _id: activity._id.toString(),
        companyId: activity.companyId?.toString(),
        userId: activity.userId.toString(),
        type: activity.type,
        courseId: activity.courseId?.toString(),
        createdAt: activity.createdAt.toISOString(),
        updatedAt: activity.updatedAt.toISOString(),
      })
    );

    console.log(
      `[ActivityService] Created ${createdActivities.length} activities in batch.`
    );
    return createdActivities;
  } catch (error) {
    console.error(
      '[ActivityService] Error creating activities in batch:',
      error
    );
    return [];
  }
};

/**
 * Creates an enrollment activity
 * @param userId - User ID
 * @param courseId - Course ID
 * @param companyId - Company ID (optional)
 * @returns Promise<CreatedActivity | null>
 */
export const createEnrollmentActivity = async (
  userId: string,
  courseId: string,
  companyId?: string
): Promise<CreatedActivity | null> => {
  return createActivity({
    companyId,
    userId,
    type: 'enrollment',
    courseId,
  });
};

/**
 * Creates a completion activity
 * @param userId - User ID
 * @param courseId - Course ID
 * @param companyId - Company ID (optional)
 * @returns Promise<CreatedActivity | null>
 */
export const createCompletionActivity = async (
  userId: string,
  courseId: string,
  companyId?: string
): Promise<CreatedActivity | null> => {
  return createActivity({
    companyId,
    userId,
    type: 'completion',
    courseId,
  });
};

/**
 * Creates a deadline activity
 * @param userId - User ID
 * @param courseId - Course ID
 * @param companyId - Company ID (optional)
 * @returns Promise<CreatedActivity | null>
 */
export const createDeadlineActivity = async (
  userId: string,
  courseId: string,
  companyId?: string
): Promise<CreatedActivity | null> => {
  return createActivity({
    companyId,
    userId,
    type: 'deadline',
    courseId,
  });
};
