'use client';

import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import CourseView from '@/components/course-view';
import FullPageLoader from '@/components/full-page-loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function fetchAssignment(assignmentId: string) {
  const response = await fetch(
    `/api/course-assignment/assignment/${assignmentId}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch assignment data');
  }
  return response.json();
}

async function fetchCourse(courseId: string) {
  const response = await fetch(`/api/course/${courseId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch course data');
  }
  const data = await response.json();
  return data.module; // Extract the course data from the response
}

export default function CourseViewPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');

  const {
    data: assignment,
    isLoading: assignmentLoading,
    isError: assignmentError,
    error: assignmentErrorData,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId!),
    enabled: !!assignmentId,
  });

  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErrorData,
  } = useQuery({
    queryKey: ['course', params.id],
    queryFn: () => fetchCourse(params.id),
    enabled: !!params.id,
  });

  if (!assignmentId) {
    return (
      <div
        className="flex-1 h-full flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No assignment ID provided. Please make sure you are accessing this
            page through a valid link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (assignmentLoading || courseLoading) {
    return <FullPageLoader />;
  }

  if (assignmentError || courseError) {
    return (
      <div
        className="flex-1 h-full flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {assignmentError && assignmentErrorData instanceof Error
              ? assignmentErrorData.message
              : courseError && courseErrorData instanceof Error
                ? courseErrorData.message
                : 'An unknown error occurred.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <CourseView mode="view" assignment={assignment} course={course} />;
}
