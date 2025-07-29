import { Schema, model, models } from 'mongoose';

// Enhanced quiz question schema to support multiple question types
const QuizQuestionSchema = new Schema(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['multiple-choice', 'true-false'],
      default: 'multiple-choice',
    },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true }, // For backward compatibility and true/false
    correctAnswerId: { type: String }, // For culture builder compatibility
  },
  { _id: false }
);

const LessonSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['text', 'video', 'image'], required: true },
  content: { type: String, required: true },
  duration: { type: Number, required: true },
  quiz: {
    type: new Schema(
      {
        title: { type: String, required: true },
        questions: [QuizQuestionSchema],
      },
      { _id: false }
    ),
    required: false,
  },
});

// Enhanced finalQuiz schema with new question types
const FinalQuizSchema = new Schema(
  {
    title: { type: String, required: true },
    questions: [QuizQuestionSchema],
  },
  { _id: false }
);

const CourseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      enum: [
        'compliance',
        'skills',
        'culture',
        'technical',
        'General',
        'Onboarding',
        'Product Training',
        'Other',
      ],
      required: true,
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      default: 0,
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
    // New fields for culture courses
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastModifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isCompanySpecific: {
      type: Boolean,
      default: false, // true for culture courses created by companies
    },
  },
  { timestamps: true }
);

// Add indexes for culture courses
CourseSchema.index({ companyId: 1, category: 1, status: 1 });
CourseSchema.index({ isCompanySpecific: 1, companyId: 1 });

const Course = models.Course || model('Course', CourseSchema);

export default Course;

// Enhanced TypeScript interfaces for Course and Lesson
export interface QuizQuestion {
  question: string;
  type?: 'multiple-choice' | 'true-false';
  options: string[];
  answer: string; // For backward compatibility and true/false answers
  correctAnswerId?: string; // For culture builder compatibility
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface Lesson {
  _id: string;
  title: string;
  type: 'text' | 'video' | 'image';
  content: string;
  duration: number;
  quiz?: Quiz;
}

export interface Course {
  _id: string;
  title: string;
  description?: string;
  category:
    | 'compliance'
    | 'skills'
    | 'culture'
    | 'technical'
    | 'General'
    | 'Onboarding'
    | 'Product Training'
    | 'Other';
  instructor?: { name: string } | string;
  duration?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  rating?: Array<{
    user: string;
    rating: number;
  }>;
  averageRating?: number;
  totalRatings?: number;
  enrolledCount?: number;
  tags: string[];
  lessons: Lesson[];
  finalQuiz?: Quiz;
  companyId?: string;
  status?: 'draft' | 'published' | 'archived';
  createdBy?: string;
  lastModifiedBy?: string;
  isCompanySpecific?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Culture Module interface for compatibility with existing culture builder
export interface CultureModule {
  _id: string;
  title: string;
  content: string;
  quiz: Array<{
    id: string;
    text: string;
    type: 'Multiple Choice' | 'True/False';
    options: Array<{
      id: string;
      text: string;
    }>;
    correctAnswerId: string;
  }>;
}

// NOTE: Existing courses will need a migration to add an empty quiz field to each lesson.
// See scripts/migrate-lesson-quiz.js for an example migration.
