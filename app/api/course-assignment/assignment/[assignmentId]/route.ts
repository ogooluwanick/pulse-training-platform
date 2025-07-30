import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  await dbConnect();

  try {
    const { assignmentId } = params;

    if (!assignmentId) {
      return NextResponse.json(
        { message: 'Missing assignmentId' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { message: 'Invalid assignmentId' },
        { status: 400 }
      );
    }

    const assignment = await CourseAssignment.findById(assignmentId).populate('course');

    if (!assignment) {
      return NextResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
