# Notification and Activity Services

This directory contains reusable services for handling in-app notifications and activity tracking in the Pulse training platform.

## Services Overview

### 1. Notification Service (`notificationService.ts`)

Handles creation of in-app notifications with various levels and types.

#### Basic Usage

```typescript
import {
  createInAppNotification,
  createSuccessNotification,
} from '@/lib/notificationService';

// Basic notification
const notification = await createInAppNotification({
  userId: 'user_id_here',
  title: 'Course Completed!',
  message: 'Congratulations on completing the course!',
  level: 'success',
  deepLink: '/dashboard/course/123',
  type: 'course_completion',
});

// Using convenience functions
const successNotification = await createSuccessNotification(
  'user_id_here',
  'Success!',
  'Operation completed successfully',
  '/dashboard',
  'system'
);
```

#### Available Functions

- `createInAppNotification()` - Create any type of notification
- `createSuccessNotification()` - Create success notifications
- `createErrorNotification()` - Create error notifications
- `createWarningNotification()` - Create warning notifications
- `createInfoNotification()` - Create info notifications
- `createCourseCompletionNotification()` - Course completion notifications
- `createCourseEnrollmentNotification()` - Course enrollment notifications
- `createDeadlineReminderNotification()` - Deadline reminder notifications
- `createInAppNotifications()` - Batch create multiple notifications

### 2. Activity Service (`activityService.ts`)

Handles creation of activity records for tracking user actions.

#### Basic Usage

```typescript
import {
  createActivity,
  createEnrollmentActivity,
} from '@/lib/activityService';

// Basic activity
const activity = await createActivity({
  userId: 'user_id_here',
  type: 'enrollment',
  courseId: 'course_id_here',
  companyId: 'company_id_here',
});

// Using convenience functions
const enrollmentActivity = await createEnrollmentActivity(
  'user_id_here',
  'course_id_here',
  'company_id_here'
);
```

#### Available Functions

- `createActivity()` - Create any type of activity
- `createEnrollmentActivity()` - Create enrollment activities
- `createCompletionActivity()` - Create completion activities
- `createDeadlineActivity()` - Create deadline activities
- `createActivities()` - Batch create multiple activities

### 3. Combined Service (`notificationActivityService.ts`)

High-level service that combines notifications and activities for common platform events.

#### Basic Usage

```typescript
import {
  handleCourseEnrollment,
  handleCourseCompletion,
} from '@/lib/notificationActivityService';

// Handle course enrollment with both notification and activity
const result = await handleCourseEnrollment(
  {
    id: 'user_id',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    companyId: 'company_id',
  },
  {
    id: 'course_id',
    title: 'JavaScript Fundamentals',
  },
  true // Send email notification
);

// Handle course completion
const completionResult = await handleCourseCompletion(
  userInfo,
  courseInfo,
  false // Don't send email
);
```

#### Available Functions

- `handleCourseEnrollment()` - Complete enrollment flow
- `handleCourseCompletion()` - Complete completion flow
- `handleDeadlineReminder()` - Deadline reminder flow
- `handleBulkCourseAssignment()` - Bulk assignment flow
- `createSystemNotification()` - System notifications
- `createWelcomeNotification()` - Welcome notifications
- `createPasswordResetNotification()` - Password reset notifications

## Notification Levels

- `info` - General information
- `success` - Successful operations
- `warning` - Warnings and reminders
- `error` - Errors and issues

## Activity Types

- `enrollment` - User enrolled in a course
- `completion` - User completed a course
- `deadline` - Deadline-related activities

## Best Practices

### 1. Error Handling

Always handle potential errors when using these services:

```typescript
try {
  const notification = await createInAppNotification({
    userId: user.id,
    title: 'Success',
    message: 'Operation completed',
    level: 'success',
  });

  if (!notification) {
    console.error('Failed to create notification');
    // Handle the error appropriately
  }
} catch (error) {
  console.error('Error creating notification:', error);
  // Handle the error appropriately
}
```

### 2. Batch Operations

For multiple operations, use batch functions when possible:

```typescript
// Instead of multiple individual calls
const notifications = await createInAppNotifications([
  { userId: 'user1', title: 'Title 1', message: 'Message 1', level: 'info' },
  { userId: 'user2', title: 'Title 2', message: 'Message 2', level: 'success' },
]);
```

### 3. User Information

When using the combined service, provide complete user information:

```typescript
const userInfo = {
  id: user._id.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  companyId: user.companyId?.toString(),
};
```

### 4. Course Information

Provide complete course information:

```typescript
const courseInfo = {
  id: course._id.toString(),
  title: course.title,
};
```

## Integration Examples

### Course Assignment API

```typescript
// In your API route
import { handleCourseEnrollment } from '@/lib/notificationActivityService';

export async function POST(request: Request) {
  // ... validation and user lookup

  const result = await handleCourseEnrollment(
    {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId?.toString(),
    },
    {
      id: course._id.toString(),
      title: course.title,
    },
    true // Send email notification
  );

  return NextResponse.json({
    success: true,
    notification: result.notification,
    activity: result.activity,
  });
}
```

### Course Completion API

```typescript
// In your course completion API
import { handleCourseCompletion } from '@/lib/notificationActivityService';

export async function POST(request: Request) {
  // ... validation and completion logic

  const result = await handleCourseCompletion(
    userInfo,
    courseInfo,
    false // Don't send email for completion
  );

  return NextResponse.json({
    success: true,
    notification: result.notification,
    activity: result.activity,
  });
}
```

### Bulk Assignment

```typescript
// For bulk course assignments
import { handleBulkCourseAssignment } from '@/lib/notificationActivityService';

const users = [
  {
    id: 'user1',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    companyId: 'company1',
  },
  {
    id: 'user2',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    companyId: 'company1',
  },
];

const result = await handleBulkCourseAssignment(
  users,
  { id: 'course1', title: 'JavaScript Fundamentals' },
  true // Send email notifications
);

console.log(
  `Created ${result.notifications.length} notifications and ${result.activities.length} activities`
);
```

## Email Integration

The services can optionally send email notifications. The email service (`email.ts`) is already integrated and handles:

- Email configuration validation
- SMTP transport setup
- HTML email templates
- Error handling and logging

## Database Schema

### Notifications Collection

```typescript
interface Notification {
  _id: ObjectId;
  userId: string;
  title: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
  deepLink?: string;
  createdAt: Date;
  isRead: boolean;
  type?: string;
}
```

### Activities Collection

```typescript
interface Activity {
  _id: ObjectId;
  companyId?: ObjectId;
  userId: ObjectId;
  type: 'enrollment' | 'completion' | 'deadline';
  courseId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## Environment Variables

Ensure these environment variables are set for email functionality:

```env
NEXT_PUBLIC_NODEMAIL_EMAIL=your-email@example.com
NEXT_PUBLIC_NODEMAIL_PASS=your-email-password
NEXT_PUBLIC_APP_URL=https://your-app-url.com
```

## Testing

You can test the services by creating simple test scripts:

```typescript
// test-notification.ts
import { createInAppNotification } from './notificationService';

async function testNotification() {
  const result = await createInAppNotification({
    userId: 'test_user_id',
    title: 'Test Notification',
    message: 'This is a test notification',
    level: 'info',
  });

  console.log('Notification created:', result);
}

testNotification();
```

## Troubleshooting

### Common Issues

1. **Invalid ObjectId format**: Ensure all IDs are valid MongoDB ObjectId strings
2. **Missing required fields**: Check that all required parameters are provided
3. **Email configuration**: Verify email environment variables are set correctly
4. **Database connection**: Ensure database connection is established before using services

### Debugging

All services include comprehensive logging. Check console output for:

- `[NotificationService]` - Notification service logs
- `[ActivityService]` - Activity service logs
- `[NotificationActivityService]` - Combined service logs

### Performance

- Use batch operations for multiple items
- Consider async/await patterns for better performance
- Monitor database query performance for large datasets
