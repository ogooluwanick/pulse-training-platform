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

    const courses = assignments.map((assignment: any) => ({
      id: assignment._id,
      courseId: assignment.course._id,
      title: assignment.course.title,
      description: assignment.course.description,
      category: assignment.course.category,
      duration: assignment.course.duration,
      difficulty: assignment.course.difficulty,
      status: assignment.status,
      progress: assignment.progress || 0,
      assignedAt: assignment.createdAt,
      completedAt: assignment.completedAt,
    }));

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Failed to fetch employee courses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
