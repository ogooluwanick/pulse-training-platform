// Utility functions for parsing and formatting API errors

// Debug mode - set to false to disable console logging
export const DEBUG_VALIDATION = true;

/* 
DEBUGGING GUIDE:
================
If questions are being rejected unexpectedly, check browser console for:

1. "=== SAVE DEBUG ===" - Shows raw question data before validation
2. "Validating question:" - Shows what validation sees for each question
3. "❌ Rejected:" - Shows why questions were rejected
4. "✅ Valid:" - Shows questions that passed validation

Common issues:
- Question text is empty or whitespace
- Multiple choice has < 2 valid options
- correctAnswerId is empty or doesn't match 'True'/'False' for T/F questions
- Options array structure mismatch (objects vs strings)

To disable debugging: Set DEBUG_VALIDATION = false above
*/

export function debugLog(message: string, data?: any) {
  if (DEBUG_VALIDATION) {
    console.log(message, data || '');
  }
}

interface ValidationError {
  path: string;
  message: string;
}

export function parseValidationError(errorString: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Parse MongoDB validation errors
  const validationPattern = /([^:]+): Path `([^`]+)` (.+?)(?=,|$)/g;
  let match;

  while ((match = validationPattern.exec(errorString)) !== null) {
    const [, , path, message] = match;
    errors.push({ path: path.trim(), message: message.trim() });
  }

  return errors;
}

export function formatValidationErrors(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    const { path, message } = error;

    // Parse the path to understand the context
    const pathParts = path.split('.');

    // Handle different types of validation errors
    if (path.includes('finalQuiz.questions')) {
      const questionIndex = parseInt(pathParts[2] || '0') + 1;
      const field = pathParts[3];

      switch (field) {
        case 'question':
          return `Final Quiz - Question ${questionIndex}: Please enter the question text`;
        case 'answer':
          return `Final Quiz - Question ${questionIndex}: Please select a correct answer`;
        case 'options':
          const optionIndex = parseInt(pathParts[4] || '0') + 1;
          return `Final Quiz - Question ${questionIndex}: Please fill in option ${optionIndex}`;
        default:
          return `Final Quiz - Question ${questionIndex}: ${field} is required`;
      }
    }

    if (path.includes('lessons') && path.includes('quiz.questions')) {
      const lessonIndex = parseInt(pathParts[1] || '0') + 1;
      const questionIndex = parseInt(pathParts[4] || '0') + 1;
      const field = pathParts[5];

      switch (field) {
        case 'question':
          return `Lesson ${lessonIndex} Quiz - Question ${questionIndex}: Please enter the question text`;
        case 'answer':
          return `Lesson ${lessonIndex} Quiz - Question ${questionIndex}: Please select a correct answer`;
        case 'options':
          const optionIndex = parseInt(pathParts[6] || '0') + 1;
          return `Lesson ${lessonIndex} Quiz - Question ${questionIndex}: Please fill in option ${optionIndex}`;
        default:
          return `Lesson ${lessonIndex} Quiz - Question ${questionIndex}: ${field} is required`;
      }
    }

    if (path.includes('lessons')) {
      const lessonIndex = parseInt(pathParts[1] || '0') + 1;
      const field = pathParts[2];

      switch (field) {
        case 'title':
          return `Lesson ${lessonIndex}: Please enter a lesson title`;
        case 'content':
          return `Lesson ${lessonIndex}: Please add lesson content`;
        case 'duration':
          return `Lesson ${lessonIndex}: Please set the lesson duration`;
        case 'type':
          return `Lesson ${lessonIndex}: Please select a lesson type (text, video, or image)`;
        default:
          return `Lesson ${lessonIndex}: ${field} is required`;
      }
    }

    // Handle top-level course fields
    switch (path) {
      case 'title':
        return 'Please enter a course title';
      case 'description':
        return 'Please add a course description';
      case 'category':
        return 'Please select a course category';
      case 'difficulty':
        return 'Please select a difficulty level';
      case 'status':
        return 'Please select a course status';
      default:
        // Fallback for any unhandled cases
        return `${path.replace(/\./g, ' → ')}: ${message}`;
    }
  });
}

export function getHumanReadableError(error: any): string {
  // Handle different error formats
  if (typeof error === 'string') {
    // Check if it's a validation error string
    if (
      error.includes('validation failed') ||
      error.includes('Path') ||
      error.includes('required')
    ) {
      const validationErrors = parseValidationError(error);
      if (validationErrors.length > 0) {
        const humanErrors = formatValidationErrors(validationErrors);

        if (humanErrors.length === 1) {
          return humanErrors[0];
        } else {
          return `Please fix the following issues:\n• ${humanErrors.join('\n• ')}`;
        }
      }
    }

    // Handle common error messages
    if (error.includes('duplicate key')) {
      return 'A course with this title already exists';
    }

    if (error.includes('Cast to ObjectId failed')) {
      return 'Invalid course ID provided';
    }

    if (error.includes('Unauthorized')) {
      return 'You are not authorized to perform this action';
    }

    if (error.includes('not found')) {
      return 'The requested course could not be found';
    }

    return error;
  }

  // Handle error objects
  if (error && typeof error === 'object') {
    // Check for details field (common in our API responses)
    if (error.details && typeof error.details === 'string') {
      return getHumanReadableError(error.details);
    }

    // Check for message field
    if (error.message && typeof error.message === 'string') {
      return getHumanReadableError(error.message);
    }

    // Check for error field
    if (error.error && typeof error.error === 'string') {
      return getHumanReadableError(error.error);
    }
  }

  // Fallback
  return 'An unexpected error occurred. Please try again.';
}

export function showValidationWarnings(filteredCount: number): string {
  if (filteredCount === 0) return '';

  const questionText = filteredCount === 1 ? 'question' : 'questions';
  const wasWere = filteredCount === 1 ? 'was' : 'were';

  return `Note: ${filteredCount} incomplete ${questionText} ${wasWere} automatically removed. Complete questions require:\n• Question text\n• For multiple choice: at least 2 options with text\n• For true/false: a selected answer\n• A correct answer selection`;
}

export function debugLessonStates(lessons: any[], selectedLessonId: string | null) {
  if (!DEBUG_VALIDATION) return;
  
  console.log('=== LESSON STATE DEBUGGING ===');
  console.log('Total lessons:', lessons.length);
  console.log('Selected lesson ID:', selectedLessonId);
  
  lessons.forEach((lesson, index) => {
    console.log(`Lesson ${index + 1}:`, {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type,
      contentLength: lesson.content?.length || 0,
      contentPreview: lesson.content?.substring(0, 50) + '...',
      isSelected: lesson.id === selectedLessonId
    });
  });
  
  const selectedLesson = lessons.find(l => l.id === selectedLessonId);
  if (selectedLesson) {
    console.log('Selected lesson details:', selectedLesson);
  } else {
    console.log('❌ No lesson found for selected ID');
  }
}

// Example usage and testing
export function testErrorParsing() {
  console.log('=== Error Parsing Examples ===');

  // Test validation errors
  const validationError =
    'Validation failed: finalQuiz.questions.0.question: Path `question` is required., finalQuiz.questions.0.answer: Path `answer` is required., lessons.0.quiz.questions.1.options.0: Path `options.0` is required.';
  console.log('Original error:', validationError);
  console.log('Human readable:', getHumanReadableError(validationError));

  // Test common errors
  const commonErrors = [
    'duplicate key error',
    'Cast to ObjectId failed',
    'Unauthorized',
    'Course not found',
    { details: 'Some validation error' },
    { error: 'Database connection failed' },
  ];

  commonErrors.forEach((error) => {
    console.log('Error:', error);
    console.log('Human readable:', getHumanReadableError(error));
    console.log('---');
  });
}
