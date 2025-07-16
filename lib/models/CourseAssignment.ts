import { Schema, model, models } from "mongoose"

const CourseAssignmentSchema = new Schema({
  course: {
    type: Schema.Types.ObjectId,
    ref: "Course",
  },
  employee: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  assignmentType: {
    type: String,
    enum: ["one-time", "interval"],
    required: true,
  },
  interval: {
    type: String,
    enum: ["daily", "monthly", "yearly"],
    required: false,
  },
  endDate: {
    type: Date,
    required: false,
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
