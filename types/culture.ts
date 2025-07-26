// Updated culture types to work with Course model

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

export function cultureModuleToCourse(
  module: Module,
  companyId: string,
  userId: string
): Partial<CultureCourse> {
  return {
    title: module.title,
    description: module.description,
    category: 'culture',
    status: module.status || 'draft',
    difficulty: module.difficulty,
    tags: module.tags || [],
    isCompanySpecific: true,
    companyId,
    createdBy: userId,
    lastModifiedBy: userId,
    lessons:
      module.lessons && module.lessons.length > 0
        ? module.lessons.map((lesson) => ({
            title: lesson.title,
            type: lesson.type,
            content: lesson.content,
            duration: lesson.duration,
            quiz:
              lesson.quiz && lesson.quiz.questions.length > 0
                ? {
                    title: lesson.quiz.title,
                    questions: lesson.quiz.questions.map((q) => ({
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
                : undefined,
          }))
        : [
            {
              title: module.title,
              type: 'text',
              content: module.content,
              duration: 5,
              quiz:
                module.quiz.length > 0
                  ? {
                      title: 'Module Quiz',
                      questions: module.quiz.map((q) => ({
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
                  : undefined,
            },
          ],
    finalQuiz: module.finalQuiz
      ? {
          title: module.finalQuiz.title,
          questions: module.finalQuiz.questions.map((q) => ({
            question: q.text,
            type: q.type === 'True/False' ? 'true-false' : 'multiple-choice',
            options: q.options.map((opt) => opt.text),
            answer:
              q.options.find((opt) => opt.id === q.correctAnswerId)?.text ||
              q.options[0]?.text ||
              '',
            correctAnswerId: q.correctAnswerId,
          })),
        }
      : undefined,
  };
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
