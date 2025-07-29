import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Course from '@/lib/models/Course';
import { scheduleIntervalAssignment } from '@/lib/cron-manager';

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

    const existingAssignments = await CourseAssignment.find({
      employee: employeeId,
    }).populate('course');

    const existingCourseIds = existingAssignments.map((a) =>
      a.course._id.toString()
    );
    const newCourseIds = assignments.map((a) => a.courseId);

    // Assignments to remove
    const assignmentsToRemove = existingAssignments.filter(
      (a) => !newCourseIds.includes(a.course._id.toString())
    );
    const assignmentIdsToRemove = assignmentsToRemove.map((a) => a._id);
    const courseIdsToDecrement = assignmentsToRemove.map((a) => a.course._id);

    // Assignments to add
    const assignmentsToAdd = assignments.filter(
      (a) => !existingCourseIds.includes(a.courseId)
    );

    // Remove old assignments
    if (assignmentIdsToRemove.length > 0) {
      await CourseAssignment.deleteMany({ _id: { $in: assignmentIdsToRemove } });
      await User.findByIdAndUpdate(employeeId, {
        $pull: { courseAssignments: { $in: assignmentIdsToRemove } },
      });
      if (courseIdsToDecrement.length > 0) {
        await Course.updateMany(
          { _id: { $in: courseIdsToDecrement } },
          { $inc: { enrolledCount: -1 } }
        );
      }
    }

    // Add new assignments
    if (assignmentsToAdd.length > 0) {
      const newAssignmentDocs = await Promise.all(
        assignmentsToAdd
          .filter((a) => a.type === 'one-time')
          .map(async (assignment) => {
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
                  ? course.lessons.map(
                      (lesson: { _id: mongoose.Types.ObjectId }) => ({
                        lessonId: lesson._id,
                        status: 'not-started',
                      })
                    )
                  : [],
            };
          })
      );

      assignmentsToAdd
        .filter((a) => a.type === 'interval')
        .forEach((assignment) => {
          scheduleIntervalAssignment({
            employee: new mongoose.Types.ObjectId(employeeId),
            course: new mongoose.Types.ObjectId(assignment.courseId),
            companyId: new mongoose.Types.ObjectId(session.user.companyId),
            interval: assignment.interval,
          });
        });

      let createdAssignments: any[] = [];
      if (newAssignmentDocs.length > 0) {
        createdAssignments =
          await CourseAssignment.insertMany(newAssignmentDocs);
      }

      const newAssignmentIds = createdAssignments.map((a) => a._id);
      const courseIdsToIncrement = assignmentsToAdd.map((a) => a.courseId);

      if (newAssignmentIds.length > 0) {
        await User.findByIdAndUpdate(employeeId, {
          $push: { courseAssignments: { $each: newAssignmentIds } },
        });
      }

      if (courseIdsToIncrement.length > 0) {
        await Course.updateMany(
          { _id: { $in: courseIdsToIncrement } },
          { $inc: { enrolledCount: 1 } }
        );
      }
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
