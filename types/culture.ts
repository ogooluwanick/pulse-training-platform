// Updated culture types to work with Course model

import { debugLog } from '@/lib/error-utils';

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'Multiple Choice' | 'True/False';
  options: AnswerOption[];
  correctAnswerId: string;
  answer?: string; // Added for backend compatibility
}

// Legacy Module interface for backward compatibility
export interface Module {
  id: string;
  title: string;
  content: string;
  quiz: Question[];
  // Extended fields for full course support
  category?: CultureModuleCategory;
  description?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons?: CourseLesson[];
  finalQuiz?: {
    title: string;
    questions: Question[];
  };
}

// Lesson interface that matches Course model
export interface CourseLesson {
  _id?: string;
  title: string;
  type: 'text' | 'video' | 'image';
  content: string;
  duration: number;
  quiz?: {
    title: string;
    questions: Array<{
      question: string;
      type?: 'multiple-choice' | 'true-false';
      options: string[];
      answer: string;
      correctAnswerId?: string;
    }>;
  };
}

// New Course-based Culture Module interface
export enum CultureModuleCategory {
  GENERAL = 'General',
  ONBOARDING = 'Onboarding',
  PRODUCT_TRAINING = 'Product Training',
  COMPLIANCE = 'Compliance',
  OTHER = 'Other',
}

// New Course-based Culture Module interface
export interface CultureCourse {
  _id: string;
  title: string;
  description?: string;
  content?: string; // From the first lesson (for backward compatibility)
  category: CultureModuleCategory;
  status: 'draft' | 'published' | 'archived';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  lessons?: CourseLesson[];
  finalQuiz?: {
    title: string;
    questions: Array<{
      question: string;
      type?: 'multiple-choice' | 'true-false';
      options: string[];
      answer: string;
      correctAnswerId?: string;
    }>;
  };
  companyId?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  isCompanySpecific?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  duration?: number;
  enrolledCount?: number;
  viewCount?: number;
  completionCount?: number;
}

// Helper function to validate and filter complete questions
const validateAndFilterQuestions = (questions: Question[]) => {
  return questions
    .filter((q) => {
      // Debug logging for transformation validation
      debugLog('Transform validating question:', {
        text: q.text,
        type: q.type,
        options: q.options,
        correctAnswerId: q.correctAnswerId,
        answer: q.answer,
        hasQuestionText: !!q.text?.trim(),
      });

      // Question text is required
      if (!q.text || q.text.trim() === '') {
        debugLog('❌ Transform rejected: No question text');
        return false;
      }

      // For true/false questions
      if (q.type === 'True/False') {
        const isValid =
          q.correctAnswerId &&
          (q.correctAnswerId === 'True' || q.correctAnswerId === 'False');
        if (!isValid) {
          debugLog(
            '❌ Transform rejected T/F: Invalid correctAnswerId:',
            q.correctAnswerId
          );
        } else {
          debugLog('✅ Transform valid T/F question');
        }
        return isValid;
      }

      // For multiple choice questions
      if (q.type === 'Multiple Choice') {
        // Handle both array of objects and array of strings for options
        let validOptions;
        if (Array.isArray(q.options)) {
          if (q.options.length > 0 && typeof q.options[0] === 'object') {
            // Array of objects: [{id: '1', text: 'Option 1'}, ...]
            validOptions = q.options.filter(
              (opt) => opt && opt.text && opt.text.trim() !== ''
            );
          } else {
            // Array of strings: ['Option 1', 'Option 2', ...] (used in some contexts)
            validOptions = q.options.filter(
              (opt) =>
                opt && typeof opt === 'string' && (opt as string).trim() !== ''
            );
          }
        } else {
          validOptions = [];
        }

        const hasEnoughOptions = validOptions.length >= 2;
        const hasCorrectAnswer =
          q.correctAnswerId && q.correctAnswerId.trim() !== '';

        debugLog('Transform MC validation:', {
          optionsArray: q.options,
          validOptionsCount: validOptions.length,
          hasEnoughOptions,
          correctAnswerId: q.correctAnswerId,
          hasCorrectAnswer,
          answer: q.answer,
        });

        if (!hasEnoughOptions) {
          debugLog('❌ Transform rejected MC: Not enough valid options');
          return false;
        }

        if (!hasCorrectAnswer) {
          debugLog('❌ Transform rejected MC: No correct answer selected');
          return false;
        }

        debugLog('✅ Transform valid MC question');
        return true;
      }

      debugLog('❌ Transform rejected: Unknown question type:', q.type);
      return false;
    })
    .map((q) => {
      // Ensure answer field is set for all valid questions
      let answerText = q.answer;

      if (!answerText || answerText.trim() === '') {
        if (q.type === 'True/False') {
          answerText = q.correctAnswerId || 'True';
        } else if (q.type === 'Multiple Choice') {
          if (Array.isArray(q.options) && q.options.length > 0) {
            if (typeof q.options[0] === 'object') {
              // Find the correct answer option
              const selectedOption = q.options.find(
                (opt) => opt.id === q.correctAnswerId
              );
              answerText = selectedOption?.text || q.options[0].text || '';
            } else {
              // Array of strings - use first option
              answerText = q.options[0] || '';
            }
          }
        }
      }

      const questionWithAnswer = {
        ...q,
        answer: answerText,
      };

      debugLog('Question with ensured answer:', questionWithAnswer);
      return questionWithAnswer;
    });
};

// Utility functions to convert between formats
export function courseToCultureModule(course: CultureCourse): Module {
  // Get the primary lesson for backward compatibility
  const primaryLesson = course.lessons?.[0];

  const module: Module = {
    id: course._id,
    title: course.title,
    content: primaryLesson?.content || course.content || '',
    description: course.description,
    category: course.category,
    tags: course.tags || [],
    status: course.status,
    difficulty: course.difficulty,
    lessons: course.lessons
      ? course.lessons.map((lesson) => {
          const newLesson: CourseLesson = {
            _id: lesson._id,
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            duration: lesson.duration,
          };
          if (lesson.quiz) {
            newLesson.quiz = {
              title: lesson.quiz.title,
              questions: lesson.quiz.questions.map((q) => ({
                question: q.question,
                type: q.type,
                options: q.options,
                answer: q.answer,
                correctAnswerId: q.correctAnswerId,
              })),
            };
          }
          return newLesson;
        })
      : [],
    quiz: [],
  };

  if (primaryLesson?.quiz) {
    module.quiz = primaryLesson.quiz.questions.map((q, index) => ({
      id: `q_${index}`,
      text: q.question,
      type: q.type === 'true-false' ? 'True/False' : 'Multiple Choice',
      options: q.options.map((opt, i) => ({
        id: `opt_${i}`,
        text: opt,
      })),
      correctAnswerId: q.correctAnswerId || 'opt_0',
      answer: q.answer,
    }));
  }

  if (course.finalQuiz) {
    module.finalQuiz = {
      title: course.finalQuiz.title,
      questions: course.finalQuiz.questions.map((q, index) => ({
        id: `fq_${index}`,
        text: q.question,
        type: q.type === 'true-false' ? 'True/False' : 'Multiple Choice',
        options: q.options.map((opt, i) => ({
          id: `fopt_${i}`,
          text: opt,
        })),
        correctAnswerId: q.correctAnswerId || `fopt_0`,
        answer: q.answer,
      })),
    };
  }

  return module;
}

// Convert culture module to course format for API
export function cultureModuleToCourse(
  module: Module,
  companyId: string | undefined,
  userId: string
): Partial<CultureCourse> {
  debugLog('=== CULTURE MODULE TO COURSE CONVERSION ===');
  debugLog('Input module:', module);
  debugLog('Module lessons:', module.lessons);

  const convertedCourse: Partial<CultureCourse> = {
    title: module.title,
    description: module.description,
    category: module.category || CultureModuleCategory.GENERAL,
    status: module.status || 'draft',
    difficulty: module.difficulty,
    tags: module.tags || [],
    companyId,
    createdBy: userId,
    lastModifiedBy: userId,
  };

  if (module.lessons && module.lessons.length > 0) {
    convertedCourse.lessons = module.lessons.map((lesson) => {
      const newLesson: CourseLesson = {
        ...lesson,
      };
      if (lesson.quiz) {
        const validQuestions = validateAndFilterQuestions(
          lesson.quiz.questions as any
        );
        if (validQuestions.length > 0) {
          newLesson.quiz = {
            title: lesson.quiz.title,
            questions: validQuestions.map((q) => ({
              question: q.text,
              type: q.type === 'True/False' ? 'true-false' : 'multiple-choice',
              options: q.options.map((opt) => opt.text),
              answer: q.answer || '',
              correctAnswerId: q.correctAnswerId,
            })),
          };
        } else {
          newLesson.quiz = undefined;
        }
      }
      return newLesson;
    });
  } else {
    convertedCourse.lessons = [
      {
        title: module.title,
        type: 'text',
        content: module.content,
        duration: 5,
        quiz: (() => {
          const validQuestions = validateAndFilterQuestions(module.quiz);
          if (validQuestions.length > 0) {
            return {
              title: 'Module Quiz',
              questions: validQuestions.map((q) => ({
                question: q.text,
                type:
                  q.type === 'True/False' ? 'true-false' : 'multiple-choice',
                options: q.options.map((opt) => opt.text),
                answer: q.answer || '',
                correctAnswerId: q.correctAnswerId,
              })),
            };
          }
          return undefined;
        })(),
      },
    ];
  }

  if (module.finalQuiz) {
    const validQuestions = validateAndFilterQuestions(module.finalQuiz.questions);
    if (validQuestions.length > 0) {
      convertedCourse.finalQuiz = {
        title: module.finalQuiz.title,
        questions: validQuestions.map((q) => ({
          question: q.text,
          type: q.type === 'True/False' ? 'true-false' : 'multiple-choice',
          options: q.options.map((opt) => opt.text),
          answer: q.answer || '',
          correctAnswerId: q.correctAnswerId,
        })),
      };
    }
  }

  debugLog('Final converted course:', convertedCourse);
  return convertedCourse;
}

// API response types
export interface CultureModuleResponse {
  success: boolean;
  module?: CultureCourse;
  modules?: CultureCourse[];
  message?: string;
  error?: string;
  details?: string; // Additional error details
}
