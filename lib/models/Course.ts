import { Schema, model, models } from 'mongoose';

const LessonSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['text', 'video', 'image'], required: true },
  content: { type: String, required: true },
  duration: { type: Number, required: true },
  quiz: {
    type: new Schema(
      {
        title: { type: String, required: true },
        questions: [
          {
            question: { type: String, required: true },
            options: [{ type: String, required: true }],
            answer: { type: String, required: true },
          },
        ],
      },
      { _id: false }
    ),
    required: false,
  },
});

// Add finalQuiz schema (same as lesson quiz)
const FinalQuizSchema = new Schema(
  {
    title: { type: String, required: true },
    questions: [
      {
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        answer: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

const CourseSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    enum: ['compliance', 'skills', 'culture', 'technical', 'General'],
    required: true,
  },
  instructor: {
    type: String,
    required: false,
  },
  duration: {
    // IN MINS
    type: Number,
    required: false,
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
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
  finalQuiz: {
    type: FinalQuizSchema,
    required: false,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Course = models.Course || model('Course', CourseSchema);

export default Course;

// Add or update TypeScript interfaces for Course and Lesson
export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

export interface Lesson {
  _id: string;
  title: string;
  type: 'text' | 'video' | 'image';
  content: string;
  duration: number;
  quiz?: {
    title: string;
    questions: QuizQuestion[];
  };
}

export interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  lessons: Lesson[];
  finalQuiz?: {
    title: string;
    questions: QuizQuestion[];
  };
  companyId?: string;
}

// NOTE: Existing courses will need a migration to add an empty quiz field to each lesson.
// See scripts/migrate-lesson-quiz.js for an example migration.
