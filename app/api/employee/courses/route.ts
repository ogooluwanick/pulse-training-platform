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

    console.log('[Employee Courses API] Request received', {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      userId: session?.user?.id,
      userRole: session?.user?.role,
    });

    if (!session || !session.user || !session.user.id) {
      console.log('[Employee Courses API] No session found');
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'EMPLOYEE') {
      console.log('[Employee Courses API] User is not an employee', {
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

    console.log('[Employee Courses API] Company context', {
      userId: session.user.id,
      activeCompanyId,
      hasCookie: !!cookieMatch,
    });

    if (!activeCompanyId) {
      console.error('[Employee Courses API] No active company selected', {
        userId: session.user.id,
        cookies: cookies.substring(0, 100) + '...', // Log first 100 chars of cookies
      });
      return NextResponse.json(
        { message: 'No active company selected' },
        { status: 400 }
      );
    }

    console.log('[Employee Courses API] Querying assignments', {
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

    console.log('[Employee Courses API] Assignments found', {
      userId: session.user.id,
      activeCompanyId,
      assignmentCount: assignments.length,
      assignmentIds: assignments.map((a) => a._id),
    });

    // Transform assignments to match frontend expectations
    const courses = assignments.map((assignment: any) => {
      const course = assignment.course;
      console.log(
        'Employee Courses API - Assignment ID:',
        assignment._id,
        'Course ID:',
        course._id,
        'Type:',
        typeof course._id
      );
      const totalLessons = course.lessons?.length || 0;
      const completedLessons =
        assignment.lessonProgress?.filter(
          (lp: any) => lp.status === 'completed'
        ).length || 0;

      // Calculate progress based on completed lessons if assignment.progress is not set
      const calculatedProgress =
        totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;
      const progress = assignment.progress || calculatedProgress;

      return {
        _id: assignment._id, // Assignment ID
        courseId: course._id.toString(), // Course ID - ensure it's a string
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

    console.log('[Employee Courses API] Response prepared', {
      userId: session.user.id,
      activeCompanyId,
      coursesCount: courses.length,
      timeInvested,
      completedCoursesCount,
      uncompletedCoursesCount,
      averageFinalQuizScore,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Employee Courses API] Error occurred', {
      userId: session?.user?.id || 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
