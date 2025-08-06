import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get recent course assignments with activity
    const recentAssignments = await CourseAssignment.find()
      .populate({
        path: 'employee',
        model: User,
        select: 'firstName lastName email companyName',
      })
      .populate({
        path: 'course',
        model: Course,
        select: 'title',
      })
      .sort({ updatedAt: -1 })
      .limit(20);

    const activities = recentAssignments.map((assignment) => {
      const employee = assignment.employee as any;
      const course = assignment.course as any;

      let action = '';
      let type: 'completion' | 'enrollment' | 'deadline' = 'enrollment';

      if (assignment.status === 'completed') {
        action = 'completed';
        type = 'completion';
      } else if (assignment.status === 'in_progress') {
        action = 'started';
        type = 'enrollment';
      } else {
        action = 'was assigned';
        type = 'enrollment';
      }

      return {
        id: assignment._id.toString(),
        user: employee
          ? `${employee.firstName} ${employee.lastName}`
          : 'Unknown User',
        action,
        course: course ? course.title : 'Unknown Course',
        timestamp: assignment.updatedAt.toISOString(),
        type,
        companyId: employee?.companyName || 'Unknown Company',
      };
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
