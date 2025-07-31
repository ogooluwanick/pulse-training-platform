'use client';

import { useQuery } from '@tanstack/react-query';
import CourseView from '@/components/course-view';
import FullPageLoader from '@/components/full-page-loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function fetchCourse(courseId: string) {
  const response = await fetch(`/api/course/${courseId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch course data');
  }
  return response.json();
}

async function fetchAssignment(courseId: string) {
  const response = await fetch(`/api/course-assignment/${courseId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch assignment data');
  }
  return response.json();
}

export default function CoursePage({ params }: { params: { id: string } }) {
  // Fetch course data
  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError: isCourseError,
    error: courseError,
  } = useQuery({
    queryKey: ['course', params.id],
    queryFn: () => fetchCourse(params.id),
  });

  // Fetch assignment data
  const {
    data: assignmentData,
    isLoading: isAssignmentLoading,
    isError: isAssignmentError,
    error: assignmentError,
  } = useQuery({
    queryKey: ['assignment', params.id],
    queryFn: () => fetchAssignment(params.id),
  });

  const isLoading = isCourseLoading || isAssignmentLoading;
  const isError = isCourseError || isAssignmentError;
  const error = courseError || assignmentError;

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error
              ? error.message
              : 'An unknown error occurred.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <CourseView
      mode="edit"
      course={courseData?.module}
      assignment={assignmentData}
    />
  );
}
