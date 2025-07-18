// Migration script to add an empty quiz field to each lesson in all courses
// Usage: node scripts/migrate-lesson-quiz.js

const mongoose = require('mongoose');
const Course = require('../lib/models/Course').default;
const dbConnect = require('../lib/dbConnect').default;

async function migrate() {
  await dbConnect();
  const courses = await Course.find({});
  let updatedCount = 0;

  for (const course of courses) {
    let modified = false;
    for (const lesson of course.lessons) {
      if (lesson.quiz === undefined) {
        lesson.quiz = undefined; // or set to a default quiz object if desired
        modified = true;
      }
    }
    if (modified) {
      await course.save();
      updatedCount++;
    }
  }
  console.log(`Migration complete. Updated ${updatedCount} courses.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
}); 