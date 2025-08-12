import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    console.log('[Employee Learning API] Request received', {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!session || !session.user || !session.user.id) {
      console.log('[Employee Learning API] No session found');
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'EMPLOYEE') {
      console.log('[Employee Learning API] User is not an employee', {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Get active company ID from cookie
    const cookies = request.headers.get('cookie') || '';
    const cookieMatch = cookies.match(/activeCompanyId=([^;]+)/);
    const activeCompanyId = cookieMatch
      ? decodeURIComponent(cookieMatch[1])
      : null;

    console.log('[Employee Learning API] Company context', {
      userId: session.user.id,
      activeCompanyId,
      hasCookie: !!cookieMatch,
    });

    if (!activeCompanyId) {
      console.error('[Employee Learning API] No active company selected', {
        userId: session.user.id,
        cookies: cookies.substring(0, 100) + '...', // Log first 100 chars of cookies
      });
      return NextResponse.json(
        { message: 'No active company selected' },
        { status: 400 }
      );
    }

    console.log('[Employee Learning API] Querying assignments', {
      userId: session.user.id,
      activeCompanyId,
    });

    const assignments = await CourseAssignment.find({
      employee: session.user.id,
      companyId: activeCompanyId,
    }).populate({
      path: 'course',
      model: Course,
    });

    console.log('[Employee Learning API] Assignments found', {
      userId: session.user.id,
      activeCompanyId,
      assignmentCount: assignments.length,
      assignmentIds: assignments.map((a) => a._id),
    });

    // Transform assignments to match frontend expectations
    const courses = assignments.map((assignment: any) => {
      const course = assignment.course;
      const totalLessons = course.lessons?.length || 0;
      const completedLessons =
        assignment.lessonProgress?.filter(
          (lp: any) => lp.status === 'completed'
        ).length || 0;

      // Calculate progress based on completed lessons
      const calculatedProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

      // Use calculated progress or fall back to assignment progress
      const progress = calculatedProgress || assignment.progress || 0;

      return {
        _id: assignment._id,
        title: course.title,
        description: course.description,
        category: course.category?.toLowerCase(),
        duration: course.duration || 0,
        progress: progress,
        status: assignment.status,
        totalLessons,
        completedLessons,

        // rating: course.rating || [],
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
    const totalCourses = courses.length;
    const completedCourses = courses.filter(
      (c) => c.status === 'completed'
    ).length;
    const inProgressCourses = courses.filter(
      (c) => c.status === 'in-progress'
    ).length;
    const notStartedCourses = courses.filter(
      (c) => c.status === 'not-started'
    ).length;

    // Calculate overdue courses (assigned more than 14 days ago and not completed)
    const now = new Date();
    const overdueCourses = courses.filter((c) => {
      if (!c.assignedAt || c.status === 'completed') return false;
      const assignedDate = new Date(c.assignedAt);
      const diffDays =
        (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
      return (
        diffDays > 14 &&
        (c.status === 'not-started' || c.status === 'in-progress')
      );
    }).length;

    // Calculate skill progress by category
    const skillProgress: { [key: string]: any } = {};
    courses.forEach((course) => {
      const category = course.category;
      if (!skillProgress[category]) {
        skillProgress[category] = { total: 0, completed: 0, progress: 0 };
      }
      skillProgress[category].total++;

      // Count as completed if course is actually completed
      if (course.status === 'completed') {
        skillProgress[category].completed++;
      }

      // Add progress to total (this will be used for average calculation)
      skillProgress[category].progress += course.progress;
    });

    // Calculate average progress for each category and ensure completed count is accurate
    Object.keys(skillProgress).forEach((category) => {
      const data = skillProgress[category];
      data.averageProgress =
        data.total > 0 ? Math.round(data.progress / data.total) : 0;

      console.log(`[Employee Learning API] Category ${category} progress:`, {
        total: data.total,
        completed: data.completed,
        totalProgress: data.progress,
        averageProgress: data.averageProgress,
      });
    });

    // Calculate total time invested (sum of completed courses duration)
    const totalTimeInvested = courses
      .filter((c) => c.status === 'completed')
      .reduce((sum, c) => sum + (c.duration || 0), 0);

    // Calculate completed this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const completedThisMonth = courses.filter(
      (c) =>
        c.status === 'completed' &&
        c.completedAt &&
        new Date(c.completedAt) >= thisMonth
    ).length;

    const stats = {
      totalCourses,
      completedCourses,
      inProgressCourses,
      notStartedCourses,
      overdueCourses,
      completedThisMonth,
      totalTimeInvested,
      certificatesEarned: completedCourses, // Assuming each completed course earns a certificate
      uncompletedCoursesCount: totalCourses - completedCourses,
    };

    const response = {
      courses,
      stats,
      skillProgress,
      uncompletedCoursesCount: totalCourses - completedCourses,
    };

    console.log('[Employee Learning API] Response prepared', {
      userId: session.user.id,
      activeCompanyId,
      coursesCount: courses.length,
      statsPresent: !!stats,
      skillProgressCategories: Object.keys(skillProgress),
      uncompletedCoursesCount: totalCourses - completedCourses,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Employee Learning API] Error occurred', {
      userId: session?.user?.id || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: 'Failed to fetch learning data' },
      { status: 500 }
    );
  }
}
