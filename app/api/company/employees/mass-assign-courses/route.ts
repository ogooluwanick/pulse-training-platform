import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { employeeIds, assignments } = await request.json();

    if (
      !employeeIds ||
      !Array.isArray(employeeIds) ||
      employeeIds.length === 0
    ) {
      return NextResponse.json(
        { message: 'Employee IDs are required' },
        { status: 400 }
      );
    }

    if (
      !assignments ||
      !Array.isArray(assignments) ||
      assignments.length === 0
    ) {
      return NextResponse.json(
        { message: 'Assignments are required' },
        { status: 400 }
      );
    }

    const assignmentDocuments = [];

    for (const employeeId of employeeIds) {
      for (const assignment of assignments) {
        // Get course details to initialize lesson progress
        const course = await Course.findById(assignment.courseId);

        assignmentDocuments.push({
          employee: new mongoose.Types.ObjectId(employeeId),
          course: new mongoose.Types.ObjectId(assignment.courseId),
          assignmentType: assignment.type,
          interval: assignment.interval,
          endDate: assignment.endDate,
          status: 'not-started',
          companyId: new mongoose.Types.ObjectId(session.user.companyId),
          lessonProgress:
            course && course.lessons
              ? course.lessons.map((lesson) => ({
                  lessonId: lesson._id,
                  status: 'not-started',
                }))
              : [],
        });
      }
    }

    const createdAssignments =
      await CourseAssignment.insertMany(assignmentDocuments);

    const userUpdates = createdAssignments.reduce(
      (acc, assignment) => {
        if (assignment && assignment.employee) {
          const userId = assignment.employee.toString();
          if (!acc[userId]) {
            acc[userId] = [];
          }
          acc[userId].push(assignment._id);
        }
        return acc;
      },
      {} as Record<string, mongoose.Types.ObjectId[]>
    );

    const bulkOps = Object.entries(userUpdates).map(
      ([userId, assignmentIds]) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(userId) },
          update: { $push: { courseAssignments: { $each: assignmentIds } } },
        },
      })
    );

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps as any);
    }

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
