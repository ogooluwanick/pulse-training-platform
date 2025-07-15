import { Schema, model, models } from "mongoose"

const CourseAssignmentSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "completed"],
    default: "not-started",
  },
  completedAt: {
    type: Date,
  },
})

const CourseAssignment =
  models.CourseAssignment || model("CourseAssignment", CourseAssignmentSchema)

export default CourseAssignment
