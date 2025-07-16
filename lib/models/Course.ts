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
    enum: ["compliance", "skills", "culture", "technical", "General"],
    required: true,
  },
  instructor: {
    type: String,
    required: false,
  },
  duration: {
    type: String,
    required: false,
  },
  difficulty: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: false,
  },
  rating: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      rating: {
        type: Number,
        min: 1,
        max: 5,
      },
    },
  ],
  enrolledCount: {
    type: Number,
    required: false,
  },
  tags: {
    type: [String],
    required: false,
    default: [],
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
