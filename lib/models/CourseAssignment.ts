import { Schema, model, models } from 'mongoose';

const CourseAssignmentSchema = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    assignmentType: {
      type: String,
      enum: ['one-time', 'interval'],
      required: true,
    },
    interval: {
      type: String,
      enum: ['daily', 'monthly', 'yearly'],
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed'],
      default: 'not-started',
    },
    lessonProgress: [
      {
        lessonId: { type: Schema.Types.ObjectId },
        status: {
          type: String,
          enum: ['not-started', 'in-progress', 'completed'],
          default: 'not-started',
        },
        completedAt: { type: Date },
        quizResult: {
          score: { type: Number },
          passed: { type: Boolean },
          answers: [
            {
              question: { type: String },
              answer: Schema.Types.Mixed,
              correct: { type: Boolean },
            },
          ],
        },
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
    finalQuizResult: {
      score: { type: Number },
      passed: { type: Boolean },
      answers: [
        {
          question: { type: String },
          answer: Schema.Types.Mixed,
          correct: { type: Boolean },
        },
      ],
    },
  },
  { timestamps: true }
);

// Create compound unique index for employee-course-company combinations
CourseAssignmentSchema.index(
  { employee: 1, course: 1, companyId: 1 },
  { unique: true }
);

const CourseAssignment =
  models.CourseAssignment || model('CourseAssignment', CourseAssignmentSchema);

export default CourseAssignment;

export interface LessonQuizResult {
  score: number;
  passed: boolean;
  answers: { question: string; answer: any; correct: boolean }[];
}

export interface LessonProgress {
  lessonId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  completedAt?: Date;
  quizResult?: LessonQuizResult;
}

export interface CourseAssignment {
  finalQuizResult?: LessonQuizResult;
}
