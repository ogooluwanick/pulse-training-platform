import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courses = await Course.find({}).lean();

    const coursesWithRatings = courses.map((course) => {
      // Calculate average rating and total ratings
      const averageRating =
        course.rating && course.rating.length > 0
          ? course.rating.reduce((acc: number, r: any) => acc + r.rating, 0) /
            course.rating.length
          : 0;

      const totalRatings = course.rating ? course.rating.length : 0;

      return {
        ...course,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalRatings,
        rating: averageRating, // Keep for backward compatibility
      };
    });

    return NextResponse.json(coursesWithRatings);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
