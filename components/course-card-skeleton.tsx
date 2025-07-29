'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CourseCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <Skeleton className="h-6 w-24" style={{ backgroundColor: '#e3e2e0' }} />
          <Skeleton className="h-6 w-20" style={{ backgroundColor: '#e3e2e0' }} />
        </div>
        <div>
          <Skeleton className="h-6 w-3/4" style={{ backgroundColor: '#e3e2e0' }} />
          <Skeleton className="h-4 w-full mt-2" style={{ backgroundColor: '#e3e2e0' }} />
          <Skeleton className="h-4 w-5/6 mt-1" style={{ backgroundColor: '#e3e2e0' }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-sm">
            <Skeleton className="h-4 w-28" style={{ backgroundColor: '#e3e2e0' }} />
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-12" style={{ backgroundColor: '#e3e2e0' }} />
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm mt-2">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-16" style={{ backgroundColor: '#e3e2e0' }} />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-16" style={{ backgroundColor: '#e3e2e0' }} />
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-4">
            <Skeleton className="h-5 w-14" style={{ backgroundColor: '#e3e2e0' }} />
            <Skeleton className="h-5 w-16" style={{ backgroundColor: '#e3e2e0' }} />
            <Skeleton className="h-5 w-12" style={{ backgroundColor: '#e3e2e0' }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
