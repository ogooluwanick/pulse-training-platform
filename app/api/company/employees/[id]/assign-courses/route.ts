import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Course from '@/lib/models/Course';

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

    // First, get existing assignments to track which courses to decrement
    const existingAssignments = await CourseAssignment.find({
      employee: employeeId,
    });
    const existingCourseIds = existingAssignments.map((a) => a.course.toString());
    const existingAssignmentIds = existingAssignments.map((a) => a._id);

    // Get new course IDs
    const newCourseIds = assignments.map((a) => a.courseId);

    // Remove all existing assignments for this employee
    await CourseAssignment.deleteMany({ employee: employeeId });

    // Decrement enrolledCount for courses that are no longer assigned
    const coursesToDecrement = existingCourseIds.filter(
      (courseId) => !newCourseIds.includes(courseId)
    );
    if (coursesToDecrement.length > 0) {
      await Course.updateMany(
        { _id: { $in: coursesToDecrement } },
        { $inc: { enrolledCount: -1 } }
      );
    }

    // Then, create the new assignments
    const newAssignmentDocs = await Promise.all(
      assignments.map(async (assignment) => {
        const course = await Course.findById(assignment.courseId);
        return {
          employee: new mongoose.Types.ObjectId(employeeId),
          course: new mongoose.Types.ObjectId(assignment.courseId),
          assignmentType: assignment.type,
          interval: assignment.interval,
          endDate: assignment.endDate,
          assignedAt: new Date(),
          status: 'not-started',
          companyId: new mongoose.Types.ObjectId(session.user.companyId),
          lessonProgress:
            course && course.lessons
              ? course.lessons.map((lesson) => ({
                  lessonId: lesson._id,
                  status: 'not-started',
                }))
              : [],
          // finalQuizResult is not set at creation
        };
      })
    );

    let createdAssignments: any[] = [];
    if (newAssignmentDocs.length > 0) {
      createdAssignments = await CourseAssignment.insertMany(newAssignmentDocs);
    }

    // Increment enrolledCount for newly assigned courses
    const coursesToIncrement = newCourseIds.filter(
      (courseId) => !existingCourseIds.includes(courseId)
    );
    if (coursesToIncrement.length > 0) {
      await Course.updateMany(
        { _id: { $in: coursesToIncrement } },
        { $inc: { enrolledCount: 1 } }
      );
    }

    // Update user's courseAssignments
    const newAssignmentIds = createdAssignments.map((a) => a._id);

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
