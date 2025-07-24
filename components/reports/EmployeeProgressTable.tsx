'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface EmployeeProgressTableProps {
  data?: EmployeeProgress[];
  loading?: boolean;
}

export default function EmployeeProgressTable({
  data,
  loading,
}: EmployeeProgressTableProps) {
  if (loading) {
    return (
      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="p-3 sm:p-4">
          <Skeleton className="h-5 sm:h-6 w-36 bg-muted/60" />
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {/* Mobile Card Layout Skeleton */}
          <div className="block sm:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24 bg-muted/70" />
                      <Skeleton className="h-3 w-32 bg-muted/60" />
                      <Skeleton className="h-3 w-20 bg-muted/60" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full bg-muted/70" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-2 w-full rounded-full bg-muted/60" />
                    <div className="flex justify-end">
                      <Skeleton className="h-3 w-8 bg-muted/60" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout Skeleton */}
          <div className="hidden sm:block">
            <div className="max-h-[400px] overflow-y-auto">
              {/* Table Header */}
              <div className="flex items-center py-3 border-b border-border">
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 bg-muted/60" />
                </div>
                <div className="flex-1 hidden md:block">
                  <Skeleton className="h-4 w-12 bg-muted/60" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-20 bg-muted/60" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-16 bg-muted/60" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-4 w-14 bg-muted/60" />
                </div>
              </div>

              {/* Table Rows */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center py-4 border-b border-border/50"
                >
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24 bg-muted/60" />
                    <div className="md:hidden">
                      <Skeleton className="h-3 w-32 bg-muted/50" />
                    </div>
                  </div>
                  <div className="flex-1 hidden md:block">
                    <Skeleton className="h-4 w-36 bg-muted/60" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 bg-muted/60" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-2 w-24 rounded-full bg-muted/60" />
                    <div className="flex justify-start">
                      <Skeleton className="h-3 w-8 bg-muted/50" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-6 w-16 rounded-full bg-muted/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-neumorphic">
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className="text-base sm:text-lg font-semibold">
          Employee Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {/* Mobile Card Layout */}
        <div className="block sm:hidden space-y-3">
          {data?.map((employee) => (
            <Card key={employee.id} className="bg-muted/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {employee.name}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {employee.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {employee.department}
                    </p>
                  </div>
                  <Badge
                    variant={
                      employee.status === 'Completed'
                        ? 'default'
                        : employee.status === 'Overdue'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-xs ml-2 flex-shrink-0"
                  >
                    {employee.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={employee.completionPercentage}
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {employee.completionPercentage}%
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block">
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Employee</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden md:table-cell">
                    Email
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">
                    Department
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">Progress</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">
                      <div className="min-w-0">
                        <div className="truncate">{employee.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden truncate">
                          {employee.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">
                      <div className="truncate max-w-[150px]">
                        {employee.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      <div className="truncate">{employee.department}</div>
                    </TableCell>
                    <TableCell>
                      <div className="w-full max-w-[100px] sm:max-w-[150px]">
                        <Progress
                          value={employee.completionPercentage}
                          className="h-2"
                        />
                        <div className="text-xs text-muted-foreground text-right mt-1">
                          {employee.completionPercentage}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === 'Completed'
                            ? 'default'
                            : employee.status === 'Overdue'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-xs"
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmployeeProgress {
  id: string;
  name: string;
  email: string;
  department: string;
  completionPercentage: number;
  status: 'Completed' | 'In Progress' | 'Overdue' | 'Not Started';
}
