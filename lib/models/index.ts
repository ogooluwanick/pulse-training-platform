// Import all models to ensure they are registered
import User from './User';
import Course from './Course';
import CourseAssignment from './CourseAssignment';
import Company from './Company';
import Activity from './Activity';

// Ensure models are registered by importing them
const models = {
  User,
  Course,
  CourseAssignment,
  Company,
  Activity,
};

export { User, Course, CourseAssignment, Company, Activity };
export default models;
