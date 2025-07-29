'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { type DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, FilterIcon, DownloadIcon } from 'lucide-react';

interface FilterBarProps {
  onApplyFilters: (filters: ReportFilters) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  loading?: boolean;
}

interface FilterOptions {
  departments: string[];
  courses: { id: string; title: string }[];
}

const fetchFilterOptions = async (): Promise<FilterOptions> => {
  const response = await fetch('/api/company/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'getFilterOptions' }),
  });
  if (!response.ok) throw new Error('Failed to fetch filter options');
  return response.json();
};

export default function FilterBar({
  onApplyFilters,
  onExport,
  loading,
}: FilterBarProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Fetch filter options
  const { data: filterOptions, isLoading: filterOptionsLoading } =
    useQuery<FilterOptions>({
      queryKey: ['filterOptions'],
      queryFn: fetchFilterOptions,
    });

  const handleApplyFilters = () => {
    const filters: ReportFilters = {
      startDate: dateRange?.from,
      endDate: dateRange?.to,
      department: selectedDepartment === 'all' ? undefined : selectedDepartment,
      courseId: selectedCourse === 'all' ? undefined : selectedCourse,
    };
    onApplyFilters(filters);
  };

  if (loading) {
    return (
      <Card className="bg-card text-card-foreground shadow-neumorphic">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-md bg-warm-gray/30" />
            <Skeleton className="h-6 w-32 bg-warm-gray/30" />
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Date Range Skeleton */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Skeleton className="h-4 w-4 rounded-md bg-warm-gray/30" />
                <Skeleton className="h-4 w-20 bg-warm-gray/30" />
              </div>
              {/* Calendar-like skeleton */}
              <div className="shadow-neumorphic rounded-md bg-background/50 p-3">
                {/* Header with month/year */}
                <div className="flex justify-center items-center gap-2 pb-4 mb-4 border-b border-border/30">
                  <Skeleton className="h-6 w-20 bg-warm-gray/30" />
                  <Skeleton className="h-6 w-16 bg-warm-gray/30" />
                </div>
                {/* Week days */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-6 w-6 rounded-md mx-auto bg-muted/40"
                    />
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-8 w-8 rounded-md mx-auto bg-muted/40"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Filters and Actions Skeleton */}
            <div className="space-y-6">
              {/* Filter Options Skeleton */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Skeleton className="h-4 w-4 rounded-md bg-warm-gray/30" />
                  <Skeleton className="h-4 w-24 bg-warm-gray/30" />
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16 bg-muted/50" />
                    <Skeleton className="h-10 w-full rounded-md bg-warm-gray/30" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-12 bg-muted/50" />
                    <Skeleton className="h-10 w-full rounded-md bg-warm-gray/30" />
                  </div>
                </div>
              </div>

              {/* Actions Skeleton */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Skeleton className="h-4 w-4 rounded-md bg-warm-gray/30" />
                  <Skeleton className="h-4 w-16 bg-warm-gray/30" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-md bg-warm-gray/30" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-10 rounded-md bg-warm-gray/30" />
                    <Skeleton className="h-10 rounded-md bg-warm-gray/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-neumorphic">
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base sm:text-lg">
            Filters & Controls
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Date Range Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">
                Date Range
              </h3>
            </div>
            <div className="flex justify-center lg:justify-start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                className="shadow-neumorphic rounded-md bg-background/50"
              />
            </div>
          </div>

          {/* Filter Options and Actions Section */}
          <div className="space-y-6">
            {/* Filter Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">
                  Filter Options
                </h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Department
                  </label>
                  <Select
                    onValueChange={setSelectedDepartment}
                    value={selectedDepartment}
                    disabled={filterOptionsLoading}
                  >
                    <SelectTrigger className="shadow-neumorphic">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {filterOptions?.departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Course
                  </label>
                  <Select
                    onValueChange={setSelectedCourse}
                    value={selectedCourse}
                    disabled={filterOptionsLoading}
                  >
                    <SelectTrigger className="shadow-neumorphic">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      {filterOptions?.courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <DownloadIcon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Actions</h3>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors w-full"
                  disabled={loading}
                >
                  Apply Filters
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onExport('csv')}
                    className="px-4 py-2 rounded-md border border-charcoal text-charcoal hover:bg-charcoal hover:text-white transition-colors"
                    disabled={loading}
                  >
                    Export CSV
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => onExport('pdf')}
                    className="px-4 py-2 rounded-md border border-charcoal text-charcoal hover:bg-charcoal hover:text-white transition-colors"
                    disabled={loading}
                  >
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  courseId?: string;
}
