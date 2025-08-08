import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Activity from '@/lib/models/Activity';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';
import { getCompanyEmployees, requireCompanyContext } from '@/lib/user-utils';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const activeCompanyId = await requireCompanyContext(session);
    const filteredEmployees = await getCompanyEmployees(activeCompanyId);

    const activities = await Activity.find({
      userId: { $in: filteredEmployees.map((emp: any) => emp._id) },
    })
      .populate({ path: 'userId', model: User, select: 'firstName lastName' })
      .populate({ path: 'courseId', model: Course, select: 'title' })
      .sort({ createdAt: -1 })
      .limit(5);

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
      };
    });

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
