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
      populate: [
        {
          path: 'course',
          model: 'Course',
        },
      ],
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const courses = user.courseAssignments.map((assignment: any) => {
      const courseData = assignment.course.toObject();
      const totalLessons = courseData.lessons ? courseData.lessons.length : 0;
      const completedLessons = assignment.lessonProgress
        ? assignment.lessonProgress.filter(
            (lesson: any) => lesson.status === 'completed'
          ).length
        : 0;
      const progress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

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
        completedAt: assignment.completedAt
          ? assignment.completedAt.toISOString()
          : null,
      };
    });

    // Calculate stats
    const completedCourses = courses.filter(
      (c: any) => c.status === 'completed'
    );
    const inProgressCourses = courses.filter(
      (c: any) => c.status === 'in-progress'
    );
    const notStartedCourses = courses.filter(
      (c: any) => c.status === 'not-started'
    );
    const overdueCourses = courses.filter((c: any) => {
      if (!c.assignedAt || c.status === 'completed') return false;
      const assignedDate = new Date(c.assignedAt);
      const now = new Date();
      const diffDays =
        (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
      return (
        diffDays > 14 &&
        (c.status === 'not-started' || c.status === 'in-progress')
      );
    });

    const totalTimeInvested = completedCourses.reduce(
      (total: number, course: any) => {
        return total + (course.duration || 0);
      },
      0
    );

    // Calculate monthly progress
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const completedThisMonth = completedCourses.filter((course: any) => {
      if (!course.completedAt) return false;
      const completedDate = new Date(course.completedAt);
      return (
        completedDate.getMonth() === currentMonth &&
        completedDate.getFullYear() === currentYear
      );
    });

    // Calculate skill development by category
    const skillProgress = courses.reduce((acc: any, course: any) => {
      if (!acc[course.category]) {
        acc[course.category] = { total: 0, completed: 0, progress: 0 };
      }
      acc[course.category].total += 1;
      if (course.status === 'completed') {
        acc[course.category].completed += 1;
      }
      acc[course.category].progress += course.progress;
      return acc;
    }, {});

    // Calculate average progress for each category
    Object.keys(skillProgress).forEach((category) => {
      if (skillProgress[category].total > 0) {
        skillProgress[category].averageProgress = Math.round(
          skillProgress[category].progress / skillProgress[category].total
        );
      }
    });

    return NextResponse.json(
      {
        courses,
        stats: {
          totalCourses: courses.length,
          completedCourses: completedCourses.length,
          inProgressCourses: inProgressCourses.length,
          notStartedCourses: notStartedCourses.length,
          overdueCourses: overdueCourses.length,
          completedThisMonth: completedThisMonth.length,
          totalTimeInvested,
          certificatesEarned: completedCourses.length,
        },
        skillProgress,
        uncompletedCoursesCount: courses.length - completedCourses.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching learning data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
