'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsWidgetsProps {
  overallCompletion?: number;
  coursesInProgress?: number;
  overdueEmployeesCount?: number;
  loading?: boolean;
}

export default function StatsWidgets({
  overallCompletion,
  coursesInProgress,
  overdueEmployeesCount,
  loading,
}: StatsWidgetsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card
            key={index}
            className="bg-card text-card-foreground shadow-neumorphic"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-32 sm:w-40 bg-muted/60" />
              </div>
              {index === 2 && (
                <Skeleton className="h-5 w-8 rounded-full bg-muted/60" />
              )}
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-8 sm:h-10 lg:h-12 w-20 sm:w-24 bg-muted/60" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Overall Completion Rate
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {overallCompletion?.toFixed(1)}%
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Courses In Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            {coursesInProgress}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Overdue Employees
          </CardTitle>
          <Badge variant="destructive" className="text-xs sm:text-sm">
            {overdueEmployeesCount}
          </Badge>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-destructive">
            {overdueEmployeesCount}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
