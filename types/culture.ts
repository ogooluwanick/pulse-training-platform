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
export interface CultureCourse {
  _id: string;
  title: string;
  description?: string;
  content?: string; // From the first lesson (for backward compatibility)
  category: 'culture';
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
  companyId: string;
  createdBy?: string;
  lastModifiedBy?: string;
  isCompanySpecific: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  duration?: number;
  enrolledCount?: number;
  viewCount?: number;
  completionCount?: number;
}

// Helper function to validate and filter complete questions
const validateAndFilterQuestions = (questions: Question[]) => {
  return questions.filter((q) => {
    // Debug logging for transformation validation
    debugLog('Transform validating question:', {
      text: q.text,
      type: q.type,
      options: q.options,
      correctAnswerId: q.correctAnswerId,
      hasQuestionText: !!q.text?.trim(),
    });

    // Question text is required
    if (!q.text || q.text.trim() === '') {
      debugLog('❌ Transform rejected: No question text');
      return false;
    }

    // For true/false questions
    if (q.type === 'True/False' || q.type === 'true-false') {
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
    if (q.type === 'Multiple Choice' || q.type === 'multiple-choice') {
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
            (opt) => opt && typeof opt === 'string' && opt.trim() !== ''
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
  });
};

// Utility functions to convert between formats
export function courseToCultureModule(course: CultureCourse): Module {
  // Get the primary lesson for backward compatibility
  const primaryLesson = course.lessons?.[0];

  return {
    id: course._id,
    title: course.title,
    content: primaryLesson?.content || course.content || '',
    description: course.description,
    tags: course.tags || [],
    status: course.status,
    difficulty: course.difficulty,
    lessons:
      course.lessons?.map((lesson) => ({
        _id: lesson._id,
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        duration: lesson.duration,
        quiz: lesson.quiz
          ? {
              title: lesson.quiz.title,
              questions: lesson.quiz.questions.map((q, index) => ({
                id: `q_${index}`,
                text: q.question,
                type:
                  q.type === 'true-false' ? 'True/False' : 'Multiple Choice',
                options: q.options.map((opt, i) => ({
                  id: `opt_${i}`,
                  text: opt,
                })),
                correctAnswerId: q.correctAnswerId || `opt_0`,
              })),
            }
          : undefined,
      })) || [],
    finalQuiz: course.finalQuiz
      ? {
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
          })),
        }
      : undefined,
    // For backward compatibility, include the primary lesson quiz as module quiz
    quiz:
      primaryLesson?.quiz?.questions?.map((q, index) => ({
        id: `q_${index}`,
        text: q.question,
        type: q.type === 'true-false' ? 'True/False' : 'Multiple Choice',
        options: q.options.map((opt, i) => ({
          id: `opt_${i}`,
          text: opt,
        })),
        correctAnswerId: q.correctAnswerId || q.answer || 'opt_0',
      })) || [],
  };
}

// Convert culture module to course format for API
export function cultureModuleToCourse(
  module: Module,
  companyId: string,
  userId: string
): Partial<CultureCourse> {
  debugLog('=== CULTURE MODULE TO COURSE CONVERSION ===');
  debugLog('Input module:', module);
  debugLog('Module lessons:', module.lessons);

  if (module.lessons) {
    module.lessons.forEach((lesson, index) => {
      debugLog(`Lesson ${index + 1} conversion:`, lesson);
      if (lesson.quiz) {
        debugLog(`Lesson ${index + 1} quiz:`, lesson.quiz);
        debugLog(`Lesson ${index + 1} quiz questions:`, lesson.quiz.questions);
      }
    });
  }

  const convertedCourse = {
    title: module.title,
    description: module.description,
    category: 'culture' as const,
    status: module.status || 'draft',
    difficulty: module.difficulty,
    tags: module.tags || [],
    isCompanySpecific: true,
    companyId,
    createdBy: userId,
    lastModifiedBy: userId,
    lessons:
      module.lessons && module.lessons.length > 0
        ? module.lessons.map((lesson, lessonIndex) => {
            debugLog(`=== CONVERTING LESSON ${lessonIndex + 1} ===`);
            debugLog('Lesson input:', lesson);

            const convertedLesson = {
              title: lesson.title,
              type: lesson.type,
              content: lesson.content,
              duration: lesson.duration,
              quiz:
                lesson.quiz && lesson.quiz.questions.length > 0
                  ? (() => {
                      debugLog(
                        `Lesson ${lessonIndex + 1} has quiz, converting...`
                      );
                      debugLog(
                        `Quiz questions before validation:`,
                        lesson.quiz.questions
                      );

                      const validQuestions = validateAndFilterQuestions(
                        lesson.quiz.questions
                      );
                      debugLog(
                        `Quiz questions after validation:`,
                        validQuestions
                      );

                      return validQuestions.length > 0
                        ? {
                            title: lesson.quiz.title,
                            questions: validQuestions.map((q) => {
                              const convertedQuestion = {
                                question: q.text,
                                type:
                                  q.type === 'True/False'
                                    ? 'true-false'
                                    : 'multiple-choice',
                                options: q.options.map((opt) => opt.text),
                                answer:
                                  q.type === 'True/False'
                                    ? q.correctAnswerId // For true/false, answer is the correctAnswerId itself
                                    : q.options.find(
                                        (opt) => opt.id === q.correctAnswerId
                                      )?.text ||
                                      q.options[0]?.text ||
                                      '',
                                correctAnswerId: q.correctAnswerId,
                              };

                              debugLog('Question conversion:', {
                                input: q,
                                output: convertedQuestion,
                              });

                              return convertedQuestion;
                            }),
                          }
                        : undefined;
                    })()
                  : undefined,
            };

            debugLog(`Lesson ${lessonIndex + 1} converted:`, convertedLesson);
            return convertedLesson;
          })
        : [
            {
              title: module.title,
              type: 'text' as const,
              content: module.content,
              duration: 5,
              quiz:
                module.quiz.length > 0
                  ? (() => {
                      const validQuestions = validateAndFilterQuestions(
                        module.quiz
                      );
                      return validQuestions.length > 0
                        ? {
                            title: 'Module Quiz',
                            questions: validQuestions.map((q) => ({
                              question: q.text,
                              type:
                                q.type === 'True/False'
                                  ? 'true-false'
                                  : 'multiple-choice',
                              options: q.options.map((opt) => opt.text),
                              answer:
                                q.type === 'True/False'
                                  ? q.correctAnswerId // For true/false, answer is the correctAnswerId itself
                                  : q.options.find(
                                      (opt) => opt.id === q.correctAnswerId
                                    )?.text ||
                                    q.options[0]?.text ||
                                    '',
                              correctAnswerId: q.correctAnswerId,
                            })),
                          }
                        : undefined;
                    })()
                  : undefined,
            },
          ],
    finalQuiz: module.finalQuiz
      ? (() => {
          const validQuestions = validateAndFilterQuestions(
            module.finalQuiz.questions
          );
          return validQuestions.length > 0
            ? {
                title: module.finalQuiz.title,
                questions: validQuestions.map((q) => ({
                  question: q.text,
                  type:
                    q.type === 'True/False' ? 'true-false' : 'multiple-choice',
                  options: q.options.map((opt) => opt.text),
                  answer:
                    q.type === 'True/False'
                      ? q.correctAnswerId // For true/false, answer is the correctAnswerId itself
                      : q.options.find((opt) => opt.id === q.correctAnswerId)
                          ?.text ||
                        q.options[0]?.text ||
                        '',
                  correctAnswerId: q.correctAnswerId,
                })),
              }
            : undefined;
        })()
      : undefined,
  };

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
