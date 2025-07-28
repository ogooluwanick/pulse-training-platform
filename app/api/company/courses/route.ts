import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const courses = await Course.find({}).lean();

    const coursesWithAggregates = await Promise.all(
      courses.map(async (course) => {
        const enrolledCount = await CourseAssignment.countDocuments({
          course: course._id,
        });

        // Calculate average rating and total ratings
        const averageRating =
          course.rating && course.rating.length > 0
            ? course.rating.reduce((acc: number, r: any) => acc + r.rating, 0) /
              course.rating.length
            : 0;

        const totalRatings = course.rating ? course.rating.length : 0;

        return {
          ...course,
          enrolledCount,
          averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          totalRatings,
          rating: averageRating, // Keep for backward compatibility
          tags: course.tags || [],
        };
      })
    );

    return NextResponse.json(coursesWithAggregates);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
