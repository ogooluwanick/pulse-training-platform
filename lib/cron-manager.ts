import cron from 'node-cron';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import mongoose, { Document, Schema } from 'mongoose';

interface ILesson extends Document {
  _id: Schema.Types.ObjectId;
  title: string;
  content: string;
}

interface IAssignment {
  employee: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  interval: 'daily' | 'monthly' | 'yearly';
}

const scheduleJob = (
  cronExpression: string,
  employeeId: string,
  courseId: string,
  companyId: string
) => {
  cron.schedule(cronExpression, async () => {
    try {
      const course = await Course.findById(courseId);
      const newAssignment = new CourseAssignment({
        employee: new mongoose.Types.ObjectId(employeeId),
        course: new mongoose.Types.ObjectId(courseId),
        assignmentType: 'one-time', // The created assignment is one-time
        assignedAt: new Date(),
        status: 'not-started',
        companyId: new mongoose.Types.ObjectId(companyId),
        lessonProgress:
          course && course.lessons
            ? course.lessons.map((lesson: ILesson) => ({
                lessonId: lesson._id,
                status: 'not-started',
              }))
            : [],
      });
      await newAssignment.save();

      await User.findByIdAndUpdate(employeeId, {
        $push: { courseAssignments: newAssignment._id },
      });

      await Course.findByIdAndUpdate(courseId, {
        $inc: { enrolledCount: 1 },
      });

      console.log(
        `Created new assignment for employee ${employeeId} and course ${courseId}`
      );
    } catch (error) {
      console.error('Error creating scheduled assignment:', error);
    }
  });
};

export const scheduleIntervalAssignment = (assignment: IAssignment) => {
  let cronExpression = '';
  switch (assignment.interval) {
    case 'daily':
      cronExpression = '0 0 * * *'; // Every day at midnight
      break;
    case 'monthly':
      cronExpression = '0 0 1 * *'; // First day of every month at midnight
      break;
    case 'yearly':
      cronExpression = '0 0 1 1 *'; // January 1st at midnight
      break;
    default:
      return;
  }

  scheduleJob(
    cronExpression,
    assignment.employee.toString(),
    assignment.course.toString(),
    assignment.companyId.toString()
  );
};
