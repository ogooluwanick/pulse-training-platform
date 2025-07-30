import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const { id: employeeId } = params;

    if (!employeeId) {
      return NextResponse.json(
        { message: 'Missing employeeId' },
        { status: 400 }
      );
    }

    // Ensure employeeId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { message: 'Invalid employeeId' },
        { status: 400 }
      );
    }

    const assignments = await CourseAssignment.find({
      employee: new mongoose.Types.ObjectId(employeeId),
    }).populate('course');

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
