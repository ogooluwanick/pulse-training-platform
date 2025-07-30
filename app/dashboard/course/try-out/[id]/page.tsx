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

export default function CourseTryOutPage({ params }: { params: { id: string } }) {
  const {
    data: courseData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['course', params.id],
    queryFn: () => fetchCourse(params.id),
  });

  console.log('Try-out page course data:', courseData);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f5f4ed' }}>
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : 'An unknown error occurred.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <CourseView mode="try-out" course={courseData?.module} />;
}
