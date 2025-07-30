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

export default function CourseViewPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get('assignmentId');

  const {
    data: assignment,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => fetchAssignment(assignmentId!),
    enabled: !!assignmentId,
  });

  console.log('View page assignment data:', assignment);

  if (!assignmentId) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
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

  return <CourseView mode="view" assignment={assignment} />;
}
