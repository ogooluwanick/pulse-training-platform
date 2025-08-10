import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'Not authenticated or not an admin' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const { id: employeeId } = params;
    if (!employeeId || !mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { message: 'Invalid employeeId' },
        { status: 400 }
      );
    }

    const assignments = await CourseAssignment.find({
      employee: employeeId,
    })
      .populate('course', 'title description duration category tags')
      .sort({ createdAt: -1 });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}
