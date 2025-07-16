import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id: employeeId } = params;
    const { assignments } = await req.json();

    if (!employeeId || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { message: 'Missing employeeId or assignments' },
        { status: 400 }
      );
    }

    // First, remove all existing assignments for this employee
    const existingAssignments = await CourseAssignment.find({ user: employeeId });
    const existingAssignmentIds = existingAssignments.map(a => a._id);

    await CourseAssignment.deleteMany({ user: employeeId });

    // Then, create the new assignments
    const newAssignmentDocs = assignments.map((assignment) => ({
      user: new mongoose.Types.ObjectId(employeeId),
      course: new mongoose.Types.ObjectId(assignment.courseId),
      assignmentType: assignment.type,
      interval: assignment.interval,
      endDate: assignment.endDate,
      assignedAt: new Date(),
      status: 'not-started',
      companyId: new mongoose.Types.ObjectId(session.user.companyId),
    }));

    let createdAssignments: any[] = [];
    if (newAssignmentDocs.length > 0) {
      createdAssignments = await CourseAssignment.insertMany(newAssignmentDocs);
    }

    // Update user's courseAssignments
    const newAssignmentIds = createdAssignments.map(a => a._id);

    await User.findByIdAndUpdate(employeeId, {
      $pull: { courseAssignments: { $in: existingAssignmentIds } },
    });

    await User.findByIdAndUpdate(employeeId, {
      $push: { courseAssignments: { $each: newAssignmentIds } },
    });

    return NextResponse.json(
      { message: 'Courses assigned successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error assigning courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
