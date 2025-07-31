import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import mongoose from 'mongoose';
import Course from '@/lib/models/Course';

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

    const assignment = await CourseAssignment.findById(assignmentId);

    if (!assignment) {
      return NextResponse.json(
        { message: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Manually populate the course to ensure all fields are included
    const course = await Course.findById(assignment.course)
      .select(
        'title description category instructor duration difficulty rating enrolledCount tags lessons finalQuiz status isCompanySpecific companyId createdBy lastModifiedBy'
      )
      .lean();
    if (course) {
      assignment.course = course;
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
