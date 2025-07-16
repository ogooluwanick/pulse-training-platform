import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courseAssignments = await CourseAssignment.find({
      user: session.user.id,
    }).populate('course');

    const courses = courseAssignments.map((assignment) => {
      const courseData = assignment.course.toObject();
      return {
        ...courseData,
        progress: assignment.progress,
        status: assignment.status,
        dueDate: assignment.endDate,
        completedLessons: 0, // This will need to be calculated based on user progress
        totalLessons: courseData.lessons ? courseData.lessons.length : 0,
      };
    });

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('Error fetching employee courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
