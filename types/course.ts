// Updated course types to work with Course model

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
  category?: CourseModuleCategory;
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
    questions: Question[]; // Use frontend Question format
  };
}

// Updated CourseModuleCategory to match Course model exactly
export enum CourseModuleCategory {
  COMPLIANCE = 'Compliance',
  SKILLS = 'Skills',
  CULTURE = 'Culture',
  TECHNICAL = 'Technical',
  GENERAL = 'General',
  ONBOARDING = 'Onboarding',
  PRODUCT_TRAINING = 'Product Training',
  OTHER = 'Other',
}

// New Course-based Course Module interface
export interface CourseModule {
  _id: string;
  title: string;
  description?: string;
  content?: string; // From the first lesson (for backward compatibility)
  category: CourseModuleCategory;
  status: 'draft' | 'published' | 'archived';
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  lessons?: CourseLesson[];
  finalQuiz?: {
    title: string;
    questions: Question[]; // Use frontend Question format
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

// Helper function to capitalize tags
export function capitalizeTags(tags: string[]): string[] {
  return tags.map(
    (tag) => tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
  );
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
export function courseToCourseModule(course: CourseModule): Module {
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
          debugLog('Converting lesson:', lesson);
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
              questions: lesson.quiz.questions.map((q, index) => {
                const convertedQuestion = {
                  id: `lq_${index}`,
                  text: q.question,
                  type:
                    q.type === 'true-false' ? 'True/False' : 'Multiple Choice',
                  options: q.options.map((opt, i) => ({
                    id: (i + 1).toString(), // Use simple numbers like QuizBuilder
                    text: opt,
                  })),
                  correctAnswerId: q.correctAnswerId || '1',
                  answer: q.answer,
                };
                return convertedQuestion;
              }),
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
        id: (i + 1).toString(), // Use simple numbers like QuizBuilder
        text: opt,
      })),
      correctAnswerId: q.correctAnswerId || '1',
      answer: q.answer,
    }));
  }

  if (course.finalQuiz) {
    module.finalQuiz = {
      title: course.finalQuiz.title,
      questions: course.finalQuiz.questions.map((q, index) => {
        const convertedQuestion = {
          id: `fq_${index}`,
          text: q.question,
          type: q.type === 'true-false' ? 'True/False' : 'Multiple Choice',
          options: q.options.map((opt, i) => ({
            id: (i + 1).toString(), // Use simple numbers like QuizBuilder
            text: opt,
          })),
          correctAnswerId: q.correctAnswerId || '1',
          answer: q.answer,
        };
        return convertedQuestion;
      }),
    };
  }

  return module;
}

// Convert course module to course format for API
export function courseModuleToCourse(
  module: Module,
  companyId: string | undefined,
  userId: string
): Partial<CourseModule> {
  const convertedCourse: Partial<CourseModule> = {
    title: module.title,
    description: module.description,
    category: module.category || CourseModuleCategory.GENERAL,
    status: module.status || 'draft',
    difficulty: module.difficulty,
    tags: capitalizeTags(module.tags || []), // Capitalize tags
    companyId,
    createdBy: userId,
    lastModifiedBy: userId,
  };

  if (module.lessons && module.lessons.length > 0) {
    convertedCourse.lessons = module.lessons.map((lesson) => {
      const newLesson: CourseLesson = {
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        duration: lesson.duration,
      };
      if (lesson.quiz) {
        const validQuestions = validateAndFilterQuestions(
          lesson.quiz.questions
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
    const validQuestions = validateAndFilterQuestions(
      module.finalQuiz.questions
    );
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

  return convertedCourse;
}

// API response types
export interface CourseModuleResponse {
  success: boolean;
  module?: CourseModule;
  modules?: CourseModule[];
  message?: string;
  error?: string;
  details?: string; // Additional error details
}
