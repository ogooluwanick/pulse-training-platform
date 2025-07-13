import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

// Define Notification structure matching server.ts and for client-side usage
export interface ClientNotification {
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

// GET: Fetch notifications for the logged-in user
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mongoClient = await clientPromise(); // Call the function
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications');

    // Fetch notifications for the user, sort by most recent
    const userNotifications = await notificationsCollection
      .find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50) // Optional: limit the number of notifications fetched
      .toArray();

    // Convert ObjectId and Date to strings for client-side compatibility
    const clientSafeNotifications: ClientNotification[] = userNotifications.map(doc => ({
      ...doc,
      _id: doc._id.toString(),
      userId: doc.userId.toString(), // Assuming userId in DB might be ObjectId, ensure string
      createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : new Date(doc.createdAt).toISOString(),
    })) as ClientNotification[]; // Cast needed if userId is already string in DB schema

    return NextResponse.json(clientSafeNotifications, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to fetch notifications', error: errorMessage }, { status: 500 });
  }
}

// POST: Mark notifications as read
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { notificationIds } = await request.json(); // Expect an array of notification IDs to mark as read

    if (!Array.isArray(notificationIds) || notificationIds.some(id => typeof id !== 'string')) {
      return NextResponse.json({ message: 'Invalid input: notificationIds must be an array of strings.' }, { status: 400 });
    }
    
    if (notificationIds.length === 0) {
        return NextResponse.json({ message: 'No notification IDs provided to mark as read.' }, { status: 200 });
    }

    const objectIdsToUpdate = notificationIds.map(id => new ObjectId(id));

    const mongoClient = await clientPromise(); // Call the function
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications');

    const result = await notificationsCollection.updateMany(
      { _id: { $in: objectIdsToUpdate }, userId: session.user.id }, // Ensure user owns the notifications
      { $set: { isRead: true } }
    );

    if (result.matchedCount === 0) {
        console.log(`[API Notifications] No notifications found to mark as read for user ${session.user.id} with IDs:`, notificationIds);
    } else {
        console.log(`[API Notifications] Marked ${result.modifiedCount} notifications as read for user ${session.user.id}. Matched: ${result.matchedCount}`);
    }
    
    return NextResponse.json({ message: `Successfully updated ${result.modifiedCount} notifications.`, modifiedCount: result.modifiedCount }, { status: 200 });

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to mark notifications as read', error: errorMessage }, { status: 500 });
  }
}

// DELETE: Clear notifications
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mongoClient = await clientPromise();
    const db = mongoClient.db();
    const notificationsCollection = db.collection('notifications');
    let result;

    // Try to parse body, it might be empty for "clear all"
    let body;
    try {
      body = await request.json();
    } catch (e) {
      // Expected if request has no body (e.g. clear all)
      body = null;
    }

    if (body && body.action === 'clearRead' && Array.isArray(body.notificationIds)) {
      // Clear specific read notifications
      if (body.notificationIds.length === 0) {
        return NextResponse.json({ message: 'No notification IDs provided to clear.', deletedCount: 0 }, { status: 200 });
      }
      const objectIdsToDelete = body.notificationIds.map((id: string) => new ObjectId(id));
      result = await notificationsCollection.deleteMany({
        _id: { $in: objectIdsToDelete },
        userId: session.user.id, // Ensure user owns the notifications
        isRead: true, // Optionally ensure they are indeed read, though client should filter
      });
      console.log(`[API Notifications] Cleared ${result.deletedCount} read notifications for user ${session.user.id}.`);
    } else if (!body || Object.keys(body).length === 0) {
      // Clear all notifications for the user
      result = await notificationsCollection.deleteMany({ userId: session.user.id });
      console.log(`[API Notifications] Cleared all ${result.deletedCount} notifications for user ${session.user.id}.`);
    } else {
      return NextResponse.json({ message: 'Invalid request body for DELETE operation.' }, { status: 400 });
    }
    
    return NextResponse.json({ message: `Successfully deleted ${result.deletedCount} notifications.`, deletedCount: result.deletedCount }, { status: 200 });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ message: 'Failed to clear notifications', error: errorMessage }, { status: 500 });
  }
}
