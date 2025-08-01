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
    // Find course assignments directly for the user
    const courseAssignments = await CourseAssignment.find({
      employee: session.user.id,
    }).populate({
      path: 'course',
      model: 'Course',
    });

    if (!courseAssignments) {
      return NextResponse.json(
        { message: 'No course assignments found' },
        { status: 404 }
      );
    }

    const courses = courseAssignments.map((assignment: any) => {
      const courseData = assignment.course?.toObject() || {};
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

      // Check if all lessons are completed
      const allLessonsCompleted =
        totalLessons > 0 && completedLessons === totalLessons;

      if (assignment.status === 'not-started' && progress > 0) {
        status = 'in-progress';
      }

      // If all lessons are completed, check if course should be marked as completed
      if (allLessonsCompleted) {
        const hasFinalQuiz =
          courseData.finalQuiz &&
          courseData.finalQuiz.questions &&
          courseData.finalQuiz.questions.length > 0;

        if (hasFinalQuiz) {
          // Course has final quiz - check if it's passed
          if (
            assignment.finalQuizResult &&
            assignment.finalQuizResult.passed === true
          ) {
            status = 'completed';
          }
        } else {
          // No final quiz - course is completed when all lessons are done
          status = 'completed';
        }
      }

      return {
        _id: courseData._id,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        duration: courseData.lessons
          ? courseData.lessons.reduce(
              (acc: number, lesson: any) => acc + lesson.duration,
              0
            )
          : 0,
        progress: progress,
        status: status,
        totalLessons: totalLessons,
        completedLessons: completedLessons,
        difficulty: courseData.difficulty,
        assignedAt: assignment.createdAt
          ? assignment.createdAt.toISOString()
          : null,
        completedAt: assignment.completedAt
          ? assignment.completedAt.toISOString()
          : null,
        assignmentType: assignment.assignmentType,
        interval: assignment.interval,
        endDate: assignment.endDate ? assignment.endDate.toISOString() : null,
        tags: courseData.tags || [],
        rating: courseData.rating || [],
        enrolledCount: courseData.enrolledCount || 0,
        finalQuiz: courseData.finalQuiz || null,
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
        return total + course.duration;
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
