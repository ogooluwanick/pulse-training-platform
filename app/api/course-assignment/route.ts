import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ message: 'Authentication secret is not configured' }, { status: 500 });
  }

  const token = await getToken({ req, secret });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const companyId = token.companyId;

    if (!companyId) {
      return NextResponse.json({ message: 'Company ID not found in token' }, { status: 400 });
    }

    const assignedCourses = await CourseAssignment.aggregate([
      {
        $match: {
          companyId: new mongoose.Types.ObjectId(companyId as string),
        },
      },
      {
        $group: {
          _id: '$course',
          assignedCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails',
        },
      },
      {
        $unwind: '$courseDetails',
      },
      {
        $project: {
          _id: '$courseDetails._id',
          title: '$courseDetails.title',
          description: '$courseDetails.description',
          instructor: '$courseDetails.instructor',
          duration: '$courseDetails.duration',
          difficulty: '$courseDetails.difficulty',
          category: '$courseDetails.category',
          rating: '$courseDetails.rating',
          tags: '$courseDetails.tags',
          assignedCount: 1,
        },
      },
    ]);

    return NextResponse.json(assignedCourses, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch assigned courses:', error);
    return NextResponse.json({ message: 'Failed to fetch assigned courses' }, { status: 500 });
  }
}
