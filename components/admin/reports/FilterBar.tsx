'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
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
import {
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterBarProps {
  onApplyFilters: (filters: ReportFilters) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  loading?: boolean;
}

interface FilterOptions {
  companies: { id: string; name: string }[];
  courses: { id: string; title: string }[];
}

const fetchFilterOptions = async (): Promise<FilterOptions> => {
  const response = await fetch('/api/admin/reports/filter-options');
  if (!response.ok) throw new Error('Failed to fetch filter options');
  return response.json();
};

export default function FilterBar({
  onApplyFilters,
  onExport,
  loading,
}: FilterBarProps) {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [activeCompanyId, setActiveCompanyId] = useState<string>('');
  const [activeCompanyName, setActiveCompanyName] = useState<string>('');

  // Get active company from cookie
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieActiveCompanyId = getCookie('activeCompanyId');
    if (cookieActiveCompanyId) {
      const decodedCompanyId = decodeURIComponent(cookieActiveCompanyId);
      setActiveCompanyId(decodedCompanyId);

      // Get company name from session
      if (session?.user?.companyIds && session?.user?.companyNames) {
        const companyIndex = session.user.companyIds.indexOf(decodedCompanyId);
        if (companyIndex >= 0) {
          setActiveCompanyName(session.user.companyNames[companyIndex]);
        }
      }
    } else if (
      session?.user?.companyIds &&
      session?.user?.companyIds.length > 0
    ) {
      // Fallback to first company
      setActiveCompanyId(session.user.companyIds[0]);
      setActiveCompanyName(session.user.companyNames?.[0] || 'Unknown Company');
    }
  }, [session]);

  const { data: filterOptions, isLoading: filterOptionsLoading } =
    useQuery<FilterOptions>({
      queryKey: ['filterOptions'],
      queryFn: fetchFilterOptions,
    });

  const handleApplyFilters = () => {
    const filters: ReportFilters = {
      startDate: dateRange?.from,
      endDate: dateRange?.to,
      companyId: selectedCompany === 'all' ? undefined : selectedCompany,
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <Skeleton className="h-4 w-4 rounded-md bg-warm-gray/30" />
                <Skeleton className="h-4 w-20 bg-warm-gray/30" />
              </div>
              <div className="shadow-neumorphic rounded-md bg-background/50 p-3">
                <div className="flex justify-center items-center gap-2 pb-4 mb-4 border-b border-border/30">
                  <Skeleton className="h-6 w-20 bg-warm-gray/30" />
                  <Skeleton className="h-6 w-16 bg-warm-gray/30" />
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-6 w-6 rounded-md mx-auto bg-muted/40"
                    />
                  ))}
                </div>
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

            <div className="space-y-6">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base sm:text-lg">
              Filters & Controls
            </CardTitle>
          </div>
          {activeCompanyName && (
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {activeCompanyName}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <div className="space-y-6">
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
                    Company
                  </label>
                  <Select
                    onValueChange={setSelectedCompany}
                    value={selectedCompany}
                    disabled={filterOptionsLoading}
                  >
                    <SelectTrigger className="shadow-neumorphic">
                      <SelectValue
                        placeholder={activeCompanyName || 'All Companies'}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Companies</SelectItem>
                      {filterOptions?.companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                          {company.id === activeCompanyId && ' (Current)'}
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
  companyId?: string;
  courseId?: string;
}
