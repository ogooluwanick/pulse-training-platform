import { Schema, model, models } from "mongoose"

const CourseSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
})

const Course = models.Course || model("Course", CourseSchema)

export default Course
