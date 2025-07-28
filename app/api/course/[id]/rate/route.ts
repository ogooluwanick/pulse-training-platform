import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rating } = await req.json();
    const courseId = params.id;
    const userId = session.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user has completed this course
    const assignment = await CourseAssignment.findOne({
      course: courseId,
      employee: userId,
      status: 'completed',
    });

    if (!assignment) {
      return NextResponse.json(
        { message: 'You must complete the course before rating it' },
        { status: 403 }
      );
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has already rated this course
    const existingRatingIndex = course.rating.findIndex(
      (r: any) => r.user.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      course.rating[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      course.rating.push({
        user: new mongoose.Types.ObjectId(userId),
        rating: rating,
      });
    }

    await course.save();

    // Calculate new average rating
    const averageRating =
      course.rating.reduce((acc: number, r: any) => acc + r.rating, 0) /
      course.rating.length;

    return NextResponse.json({
      message: 'Rating submitted successfully',
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: course.rating.length,
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courseId = params.id;
    const userId = session.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if user has rated this course
    const userRating = course.rating.find(
      (r: any) => r.user.toString() === userId
    );

    // Calculate average rating
    const averageRating =
      course.rating.length > 0
        ? course.rating.reduce((acc: number, r: any) => acc + r.rating, 0) /
          course.rating.length
        : 0;

    return NextResponse.json({
      userRating: userRating?.rating || null,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalRatings: course.rating.length,
    });
  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
