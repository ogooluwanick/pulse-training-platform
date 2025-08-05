import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const assignments = await CourseAssignment.find({
      employee: session.user.id,
    }).populate({
      path: 'course',
      model: Course,
    });

    const learningData = {
      totalCourses: assignments.length,
      completedCourses: assignments.filter((a: any) => a.status === 'completed')
        .length,
      inProgressCourses: assignments.filter(
        (a: any) => a.status === 'in-progress'
      ).length,
      notStartedCourses: assignments.filter(
        (a: any) => a.status === 'not-started'
      ).length,
      averageProgress:
        assignments.length > 0
          ? Math.round(
              assignments.reduce(
                (sum: number, a: any) => sum + (a.progress || 0),
                0
              ) / assignments.length
            )
          : 0,
    };

    return NextResponse.json(learningData);
  } catch (error) {
    console.error('Failed to fetch learning data:', error);
    return NextResponse.json(
      { message: 'Failed to fetch learning data' },
      { status: 500 }
    );
  }
}
