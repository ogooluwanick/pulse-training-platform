require('dotenv').config({ path: '.env.local' });
const cron = require('node-cron');
const mongoose = require('mongoose');
const CourseAssignment = require('../lib/models/CourseAssignment');
const User = require('../lib/models/User');
const Course = require('../lib/models/Course');

const employeeId = '6886a961e733962f77f78c09'; // Replace with a valid employee ID
const courseId = '60d5ec49f5a8a12a4c8a8a9a'; // Replace with a valid course ID
const companyId = '6886a4d4e733962f77f78c00'; // Replace with a valid company ID

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

cron.schedule('* * * * *', async () => {
  console.log('Running cron job to create assignment...');
  try {
    const course = await Course.findById(courseId);
    const newAssignment = new CourseAssignment({
      employee: new mongoose.Types.ObjectId(employeeId),
      course: new mongoose.Types.ObjectId(courseId),
      assignmentType: 'one-time',
      assignedAt: new Date(),
      status: 'not-started',
      companyId: new mongoose.Types.ObjectId(companyId),
      lessonProgress:
        course && course.lessons
          ? course.lessons.map((lesson) => ({
              lessonId: lesson._id,
              status: 'not-started',
            }))
          : [],
    });
    const savedAssignment = await newAssignment.save();

    await User.findByIdAndUpdate(employeeId, {
      $push: { courseAssignments: savedAssignment._id },
    });

    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledCount: 1 },
    });

    console.log(
      `Created new assignment with _id: ${savedAssignment._id} for employee ${employeeId} and course ${courseId}`
    );
  } catch (error) {
    console.error('Error creating scheduled assignment:', error);
  }
});

console.log('Cron job scheduled to run every minute.');
