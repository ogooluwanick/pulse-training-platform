'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import CourseView from '@/components/course-view';
import FullPageLoader from '@/components/full-page-loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

// Helper function to get active company ID from cookie
function getActiveCompanyId(): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; activeCompanyId=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop()?.split(';').shift();
    return cookieValue ? decodeURIComponent(cookieValue) : null;
  }
  return null;
}

async function fetchCourse(courseId: string, activeCompanyId: string | null) {
  console.log('[CoursePage] fetchCourse called', {
    courseId,
    activeCompanyId,
    timestamp: new Date().toISOString(),
  });

  const response = await fetch(`/api/course/${courseId}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(activeCompanyId && { 'x-company-id': activeCompanyId }),
    },
  });

  console.log('[CoursePage] fetchCourse response', {
    courseId,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('[CoursePage] fetchCourse error', {
      courseId,
      status: response.status,
      errorData,
    });
    throw new Error(
      errorData?.message || `Failed to fetch course data: ${response.status}`
    );
  }
  return response.json();
}

async function fetchAssignment(
  courseId: string,
  activeCompanyId: string | null
) {
  console.log('[CoursePage] fetchAssignment called', {
    courseId,
    activeCompanyId,
    timestamp: new Date().toISOString(),
  });

  const response = await fetch(`/api/course-assignment/${courseId}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(activeCompanyId && { 'x-company-id': activeCompanyId }),
    },
  });

  console.log('[CoursePage] fetchAssignment response', {
    courseId,
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('[CoursePage] fetchAssignment error', {
      courseId,
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

export default function CoursePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Get active company ID from cookie on mount and track changes
  useEffect(() => {
    setMounted(true);
    const companyId = getActiveCompanyId();
    setActiveCompanyId(companyId);

    console.log('[CoursePage] Component mounted', {
      courseId: params.id,
      activeCompanyId: companyId,
      userId: session?.user?.id,
      timestamp: new Date().toISOString(),
    });
  }, [params.id, session?.user?.id]);

  // Listen for company changes via cookie updates
  useEffect(() => {
    if (!mounted) return;

    const checkForCompanyChange = () => {
      const newCompanyId = getActiveCompanyId();
      if (newCompanyId !== activeCompanyId) {
        console.log('[CoursePage] Company change detected', {
          oldCompanyId: activeCompanyId,
          newCompanyId,
          courseId: params.id,
        });
        setActiveCompanyId(newCompanyId);
      }
    };

    // Check for changes every 1000ms
    const interval = setInterval(checkForCompanyChange, 1000);
    return () => clearInterval(interval);
  }, [mounted, activeCompanyId, params.id]);

  // Fetch course data
  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError: isCourseError,
    error: courseError,
  } = useQuery({
    queryKey: ['course', params.id, activeCompanyId],
    queryFn: () => fetchCourse(params.id, activeCompanyId),
    enabled: mounted && !!activeCompanyId,
    staleTime: 0, // Force fresh data on company change
  });

  // Fetch assignment data
  const {
    data: assignmentData,
    isLoading: isAssignmentLoading,
    isError: isAssignmentError,
    error: assignmentError,
  } = useQuery({
    queryKey: ['assignment', params.id, activeCompanyId],
    queryFn: () => fetchAssignment(params.id, activeCompanyId),
    enabled: mounted && !!activeCompanyId,
    staleTime: 0, // Force fresh data on company change
  });

  const isLoading = isCourseLoading || isAssignmentLoading;
  const isError = isCourseError || isAssignmentError;
  const error = courseError || assignmentError;

  // Add loading state with company context info
  if (isLoading) {
    console.log('[CoursePage] Loading state', {
      courseId: params.id,
      activeCompanyId,
      isCourseLoading,
      isAssignmentLoading,
      timestamp: new Date().toISOString(),
    });
    return <FullPageLoader />;
  }

  // Enhanced error handling with more context
  if (isError || !activeCompanyId) {
    const errorMessage = !activeCompanyId
      ? 'No active company selected. Please select a company to view courses.'
      : error instanceof Error
        ? error.message
        : 'An unknown error occurred.';

    console.error('[CoursePage] Error state', {
      courseId: params.id,
      activeCompanyId,
      error: errorMessage,
      isCourseError,
      isAssignmentError,
      courseError,
      assignmentError,
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

  console.log('[CoursePage] Rendering CourseView', {
    courseId: params.id,
    activeCompanyId,
    hasCourseData: !!courseData?.module,
    hasAssignmentData: !!assignmentData,
    courseTitle: courseData?.module?.title,
    assignmentStatus: assignmentData?.status,
    timestamp: new Date().toISOString(),
  });

  return (
    <CourseView
      mode="edit"
      course={courseData?.module}
      assignment={assignmentData}
    />
  );
}
