// Import all models to ensure they are registered
import User from './User';
import Course from './Course';
import CourseAssignment from './CourseAssignment';
import Company from './Company';
import Activity from './Activity';
import Inquiry from './Inquiry';

// Ensure models are registered by importing them
const models = {
  User,
  Course,
  CourseAssignment,
  Company,
  Activity,
  Inquiry,
};

export { User, Course, CourseAssignment, Company, Activity, Inquiry };
export default models;
