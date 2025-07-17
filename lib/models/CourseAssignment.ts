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
  lessonProgress: [
    {
      lessonId: { type: Schema.Types.ObjectId },
      status: {
        type: String,
        enum: ["not-started", "in-progress", "completed"],
        default: "not-started",
      },
      completedAt: { type: Date },
    },
  ],
  quizAnswers: [
    {
      questionId: { type: Schema.Types.ObjectId },
      answer: Schema.Types.Mixed,
    },
  ],
  quizScore: {
    type: Number,
  },
  quizDuration: {
    type: Number, // in seconds
  },
  completedAt: {
    type: Date,
  },
})

const CourseAssignment =
  models.CourseAssignment || model("CourseAssignment", CourseAssignmentSchema)

export default CourseAssignment
