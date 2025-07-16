import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

        interface CourseRating {
          rating: number;
          [key: string]: any;
        }

        interface CourseType {
          _id: string;
          rating?: CourseRating[];
          tags?: string[];
          [key: string]: any;
        }

        const averageRating: number =
          course.rating && course.rating.length > 0
            ? course.rating.reduce((acc: number, r: CourseRating) => acc + r.rating, 0) /
              course.rating.length
            : 0;

        return {
          ...course,
          enrolledCount,
          rating: averageRating,
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
