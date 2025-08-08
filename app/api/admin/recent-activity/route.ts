import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Activity from '@/lib/models/Activity';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get all activities across all companies
    const activities = await Activity.find({})
      .populate({
        path: 'userId',
        model: User,
        select: 'firstName lastName companyId',
      })
      .populate({
        path: 'courseId',
        model: Course,
        select: 'title',
        match: {}, // No status filter for admin users
      })
      .sort({ createdAt: -1 })
      .limit(10);

    const formattedActivities = activities.map((activity) => {
      const user = activity.userId as any;
      const course = activity.courseId as any;
      let action = '';
      switch (activity.type) {
        case 'completion':
          action = 'completed';
          break;
        case 'enrollment':
          action = 'started';
          break;
        case 'deadline':
          action = 'missed deadline for';
          break;
      }
      return {
        id: activity._id,
        user: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        action,
        course: course ? course.title : 'Unknown Course',
        timestamp: activity.createdAt.toISOString(),
        type: activity.type,
        companyId: user?.companyId || null,
      };
    });

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
