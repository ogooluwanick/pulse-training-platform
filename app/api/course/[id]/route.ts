import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Types } from 'mongoose';
import { resolveCompanyIdFromRequest } from '@/lib/user-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.log('[Course API] No session found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Course API] Request received', {
    userId: session.user.id,
    userRole: session.user.role,
    courseId: params.id,
    timestamp: new Date().toISOString(),
  });

  await dbConnect();

  try {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(params.id)) {
      console.error('[Course API] Invalid ObjectId format:', params.id);
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Get company context for employees
    let activeCompanyId: string | null = null;
    if (session.user.role === 'EMPLOYEE') {
      const resolvedCompanyId = resolveCompanyIdFromRequest(req, session);
      activeCompanyId = resolvedCompanyId || null;

      console.log('[Course API] Company context for employee', {
        userId: session.user.id,
        activeCompanyId,
        courseId: params.id,
      });

      // For employees, check if they have an assignment for this course in the active company
      if (activeCompanyId) {
        const assignment = await CourseAssignment.findOne({
          course: new Types.ObjectId(params.id),
          employee: new Types.ObjectId(session.user.id),
          companyId: new Types.ObjectId(activeCompanyId),
        });

        if (!assignment) {
          console.log('[Course API] No assignment found for employee', {
            userId: session.user.id,
            courseId: params.id,
            activeCompanyId,
          });
          return NextResponse.json(
            {
              message:
                'Course not found or not assigned to you in the current company',
            },
            { status: 404 }
          );
        }

        console.log('[Course API] Assignment found for employee', {
          userId: session.user.id,
          courseId: params.id,
          activeCompanyId,
          assignmentId: assignment._id,
          assignmentStatus: assignment.status,
        });
      }
    }

    // For admin and company users, allow access to all courses regardless of status
    // For employees, only allow access to published courses
    const statusFilter =
      session.user.role === 'EMPLOYEE' ? { status: 'published' } : {};

    const course = await Course.findOne({
      _id: params.id,
      ...statusFilter,
    }).lean();

    if (!course) {
      console.error('[Course API] Course not found or not published', {
        courseId: params.id,
        userRole: session.user.role,
        statusFilter,
      });
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    console.log('[Course API] Course found successfully', {
      courseId: params.id,
      courseTitle: (course as any).title,
      courseStatus: (course as any).status,
      userRole: session.user.role,
      activeCompanyId,
    });

    // Calculate average rating and total ratings
    // const ratings = (course as any).rating || [];
    // const totalRatings = ratings.length;
    // const averageRating =
    //   totalRatings > 0
    //     ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
    //       totalRatings
    //     : 0;

    // const courseWithRatings = {
    //   ...course,
    //   averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
    //   totalRatings,
    // };

    return NextResponse.json({ success: true, module: course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      status,
      tags,
      lessons,
      finalQuiz,
      companyId,
    } = body;

    const updatedCourse = await Course.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        category,
        status,
        tags,
        lessons,
        finalQuiz,
        companyId,
        lastModifiedBy: session.user.id,
        isCompanySpecific: !!companyId,
      },
      { new: true }
    );

    if (!updatedCourse) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, module: updatedCourse });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const deletedCourse = await Course.findByIdAndDelete(params.id);

    if (!deletedCourse) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
