import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import { User, CourseAssignment, Course } from '@/lib/models';

export const dynamic = 'force-dynamic';

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await User.findById(session.user.id).populate({
      path: 'courseAssignments',
      populate: {
        path: 'course',
        model: 'Course',
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const completedCourses = user.courseAssignments.filter(
      (assignment: any) => assignment.status === 'completed'
    );

    const uncompletedCourses = user.courseAssignments.filter(
      (assignment: any) => assignment.status !== 'completed'
    );

    const timeInvested = completedCourses.reduce(
      (total: number, assignment: any) => {
        return total + (assignment.course.duration || 0);
      },
      0
    );

    // Calculate average final quiz score
    const coursesWithFinalQuizScores = completedCourses.filter(
      (assignment: any) =>
        assignment.finalQuizResult &&
        typeof assignment.finalQuizResult.score === 'number'
    );

    const averageFinalQuizScore =
      coursesWithFinalQuizScores.length > 0
        ? Math.round(
            coursesWithFinalQuizScores.reduce(
              (total: number, assignment: any) =>
                total + assignment.finalQuizResult.score,
              0
            ) / coursesWithFinalQuizScores.length
          )
        : 0;

    const courses = user.courseAssignments.map((assignment: any) => {
      const courseData = assignment.course.toObject();
      const totalLessons = courseData.lessons ? courseData.lessons.length : 0;

      // Calculate completed lessons from lessonProgress
      const completedLessons = assignment.lessonProgress
        ? assignment.lessonProgress.filter(
            (lesson: any) => lesson.status === 'completed'
          ).length
        : 0;

      // Calculate progress percentage
      const progress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      // Determine status based on progress and assignment status
      let status = assignment.status;
      if (assignment.status === 'not-started' && progress > 0) {
        status = 'in-progress';
      }

      return {
        _id: courseData._id,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        duration: courseData.duration || 0,
        progress: progress,
        status: status,
        totalLessons: totalLessons,
        completedLessons: completedLessons,
        difficulty: courseData.difficulty,
        assignedAt: assignment.assignedAt
          ? assignment.assignedAt.toISOString()
          : null,
      };
    });

    return NextResponse.json(
      {
        courses,
        timeInvested,
        completedCoursesCount: completedCourses.length,
        uncompletedCoursesCount: uncompletedCourses.length,
        averageFinalQuizScore,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching employee courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
