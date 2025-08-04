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
    const courses = await Course.find({ status: 'published' })
      .populate('instructor')
      .lean();

    // Calculate average rating and total ratings for each course
    const coursesWithRatings = courses.map((course) => {
      const ratings = course.rating || [];
      const totalRatings = ratings.length;
      const averageRating =
        totalRatings > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
            totalRatings
          : 0;

      return {
        ...course,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings,
      };
    });

    return NextResponse.json({ success: true, courses: coursesWithRatings });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      category,
      status,
      difficulty,
      tags,
      lessons,
      finalQuiz,
      companyId,
    } = body;

    const newCourse = new Course({
      title,
      description,
      category,
      status,
      difficulty,
      tags,
      lessons,
      finalQuiz,
      companyId,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      isCompanySpecific: !!companyId,
    });

    await newCourse.save();

    return NextResponse.json(
      { success: true, course: newCourse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
