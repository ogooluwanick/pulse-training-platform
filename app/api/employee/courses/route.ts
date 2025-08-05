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

    // Transform assignments to match frontend expectations
    const courses = assignments.map((assignment: any) => {
      const course = assignment.course;
      const totalLessons = course.lessons?.length || 0;
      const completedLessons =
        assignment.lessonProgress?.filter(
          (lp: any) => lp.status === 'completed'
        ).length || 0;

      return {
        _id: assignment._id,
        title: course.title,
        description: course.description,
        category: course.category?.toLowerCase(),
        duration: course.duration || 0,
        progress: assignment.progress || 0,
        status: assignment.status,
        totalLessons,
        completedLessons,
        difficulty: course.difficulty,
        rating: course.rating || [],
        enrolledCount: course.enrolledCount || 0,
        tags: course.tags || [],
        assignedAt: assignment.createdAt,
        completedAt: assignment.completedAt,
        assignmentType: assignment.assignmentType,
        interval: assignment.interval,
        endDate: assignment.endDate,
      };
    });

    // Calculate stats
    const completedCoursesCount = courses.filter(
      (c) => c.status === 'completed'
    ).length;
    const uncompletedCoursesCount = courses.length - completedCoursesCount;

    // Calculate total time invested (sum of completed courses duration)
    const timeInvested = courses
      .filter((c) => c.status === 'completed')
      .reduce((sum, c) => sum + (c.duration || 0), 0);

    // Calculate average final quiz score from completed courses
    const completedAssignments = assignments.filter(
      (a: any) => a.status === 'completed'
    );
    const averageFinalQuizScore =
      completedAssignments.length > 0
        ? Math.round(
            completedAssignments.reduce(
              (sum: number, a: any) => sum + (a.finalQuizResult?.score || 0),
              0
            ) / completedAssignments.length
          )
        : 0;

    const response = {
      courses,
      timeInvested,
      completedCoursesCount,
      uncompletedCoursesCount,
      averageFinalQuizScore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch employee courses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
