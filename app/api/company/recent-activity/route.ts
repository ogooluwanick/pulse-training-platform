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
  console.log('[RecentActivity] API endpoint called');

  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    console.log('[RecentActivity] Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userId: session?.user?.id,
    });

    if (!session || !session.user || session.user.role !== 'COMPANY') {
      console.log('[RecentActivity] Unauthorized access attempt');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const companyId = session.user.companyId;

    if (!companyId) {
      return new NextResponse('Company ID not found in session', {
        status: 400,
      });
    }

    const filteredEmployees = await getCompanyEmployees(companyId);

    console.log('[RecentActivity] Company context:', {
      companyId,
      employeesFound: filteredEmployees.length,
    });

    const activities = await Activity.find({
      userId: { $in: filteredEmployees.map((emp: any) => emp._id) },
      companyId: new mongoose.Types.ObjectId(companyId),
    })
      .populate({ path: 'userId', model: User, select: 'firstName lastName' })
      .populate({
        path: 'courseId',
        model: Course,
        select: 'title',
        match: {}, // No status filter for company users
      })
      .sort({ createdAt: -1 })
      .limit(5);

    console.log('[RecentActivity] Activities found:', activities.length);

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

    console.log('[RecentActivity] Formatted activities:', formattedActivities);

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
