'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import CourseView from '@/components/course-view';
import FullPageLoader from '@/components/full-page-loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

async function fetchAssignmentWithCourse(assignmentId: string) {
  console.log('[AssignmentPage] fetchAssignmentWithCourse called', {
    assignmentId,
    timestamp: new Date().toISOString(),
  });

  const response = await fetch(
    `/api/course-assignment/assignment/${assignmentId}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('[AssignmentPage] fetchAssignmentWithCourse response', {
    assignmentId,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('[AssignmentPage] fetchAssignmentWithCourse error', {
      assignmentId,
      status: response.status,
      errorData,
    });
    throw new Error(
      errorData?.message ||
        `Failed to fetch assignment data: ${response.status}`
    );
  }
  return response.json();
}

export default function AssignmentPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();

  console.log('[AssignmentPage] Component rendered', {
    assignmentId: params.id,
    userId: (session?.user as any)?.id,
    timestamp: new Date().toISOString(),
  });

  // Fetch assignment and course data in one call
  const {
    data: assignmentData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['assignmentWithCourse', params.id],
    queryFn: () => fetchAssignmentWithCourse(params.id),
    enabled: !!params.id,
    staleTime: 0, // Force fresh data
  });

  // Add loading state
  if (isLoading) {
    console.log('[AssignmentPage] Loading state', {
      assignmentId: params.id,
      timestamp: new Date().toISOString(),
    });
    return <FullPageLoader />;
  }

  // Enhanced error handling
  if (isError) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.';

    console.error('[AssignmentPage] Error state', {
      assignmentId: params.id,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });

    return (
      <div
        className="flex-1 h-full flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!assignmentData) {
    console.error('[AssignmentPage] No assignment data', {
      assignmentId: params.id,
      timestamp: new Date().toISOString(),
    });

    return (
      <div
        className="flex-1 h-full flex items-center justify-center"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Assignment not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log('[AssignmentPage] Rendering CourseView', {
    assignmentId: params.id,
    hasCourseData: !!assignmentData?.course,
    hasAssignmentData: !!assignmentData,
    courseTitle: assignmentData?.course?.title,
    assignmentStatus: assignmentData?.status,
    timestamp: new Date().toISOString(),
  });

  return (
    <CourseView
      mode="edit"
      course={assignmentData?.course}
      assignment={assignmentData}
    />
  );
}
