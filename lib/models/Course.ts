import { Schema, model, models } from "mongoose";

const LessonSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ["text", "video", "image"], required: true },
  content: { type: String, required: true },
  duration: { type: Number, required: true },
});

const QuizQuestionSchema = new Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answer: { type: String, required: true },
});

const QuizSchema = new Schema({
  title: { type: String, required: true },
  questions: [QuizQuestionSchema],
});

const CourseSchema = new Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ["compliance", "skills", "culture"],
    required: true,
  },
  lessons: [LessonSchema],
  quiz: QuizSchema,
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const Course = models.Course || model("Course", CourseSchema);

export default Course;
