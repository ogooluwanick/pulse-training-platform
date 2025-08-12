'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Clock,
  Award,
  Play,
  CheckCircle,
  Search,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { LearningProgressChart } from '@/components/learning-progress-chart';
import { formatDuration } from '@/lib/duration';
import FullPageLoader from '@/components/full-page-loader';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  progress: number;
  status: string;
  totalLessons: number;
  completedLessons: number;

  assignedAt?: string;
  completedAt?: string;
}

interface LearningData {
  courses: Course[];
  stats: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    notStartedCourses: number;
    overdueCourses: number;
    completedThisMonth: number;
    totalTimeInvested: number;
    certificatesEarned: number;
  };
  skillProgress: { [key: string]: any };
  uncompletedCoursesCount: number;
}

const fetchLearningData = async (): Promise<LearningData> => {
  const response = await fetch('/api/employee/learning');
  if (!response.ok) {
    throw new Error('Failed to fetch learning data');
  }
  return response.json();
};

export default function MyLearningPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data, isLoading, error } = useQuery<LearningData, Error>({
    queryKey: ['learningData'],
    queryFn: fetchLearningData,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-green text-alabaster';
      case 'in-progress':
        return 'bg-charcoal text-alabaster';
      case 'not-started':
        return 'bg-warm-gray text-alabaster';
      default:
        return 'bg-warm-gray text-alabaster';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'compliance':
        return <Award className="h-4 w-4 text-warning-ochre" />;
      case 'skills':
        return <BookOpen className="h-4 w-4 text-charcoal" />;
      case 'culture':
        return <BookOpen className="h-4 w-4 text-success-green" />;
      case 'technical':
        return <BookOpen className="h-4 w-4 text-charcoal" />;
      default:
        return <BookOpen className="h-4 w-4 text-charcoal" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'compliance':
        return 'bg-warning-ochre text-alabaster';
      case 'skills':
        return 'bg-charcoal text-alabaster';
      case 'culture':
        return 'bg-success-green text-alabaster';
      case 'technical':
        return 'bg-blue-600 text-alabaster';
      default:
        return 'bg-warm-gray text-alabaster';
    }
  };

  // Filter courses based on search and filters
  const filteredCourses =
    data?.courses?.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || course.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' || course.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    }) || [];

  if (isLoading) {
    return <FullPageLoader placeholder="learning dashboard" />;
  }

  if (error) {
    return (
      <div
        className="flex-1 space-y-6 p-6"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="text-center text-warning-ochre">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Error loading learning data: {error.message}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 space-y-6 p-6"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">My Learning</h1>
          <p className="text-warm-gray">
            Track your progress and continue your learning journey
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 bg-alabaster border-warm-gray/30">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-started">Not Started</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-32 bg-alabaster border-warm-gray/30">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="compliance">Compliance</SelectItem>
              <SelectItem value="skills">Skills</SelectItem>
              <SelectItem value="culture">Course</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Courses in Progress
            </CardTitle>
            <BookOpen className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {data?.stats.inProgressCourses || 0}
            </div>
            <p className="text-xs text-warm-gray">
              {data?.stats.overdueCourses || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Completed This Month
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {data?.stats.completedThisMonth || 0}
            </div>
            <p className="text-xs text-warm-gray">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Learning Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-charcoal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {formatDuration((data?.stats.totalTimeInvested || 0) * 60)}
            </div>
            <p className="text-xs text-warm-gray">Total invested</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-warm-gray/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-warm-gray">
              Completion Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-charcoal">
              {data?.stats.totalCourses && data.stats.totalCourses > 0
                ? Math.round(
                    (data.stats.completedCourses / data.stats.totalCourses) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-warm-gray">
              {data?.stats.completedCourses || 0} of{' '}
              {data?.stats.totalCourses || 0} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="bg-parchment border border-warm-gray/20">
          <TabsTrigger
            value="assignments"
            className="data-[state=active]:bg-alabaster"
          >
            My Assignments
          </TabsTrigger>
          <TabsTrigger
            value="progress"
            className="data-[state=active]:bg-alabaster"
          >
            Progress Tracking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-6">
          <Card className="bg-card border-warm-gray/20">
            <CardHeader>
              <CardTitle className="text-charcoal">
                Current Assignments
              </CardTitle>
              <CardDescription className="text-warm-gray">
                Courses assigned to you by your manager or HR department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredCourses.length === 0 ? (
                <div className="text-center text-warm-gray py-8">
                  <BookOpen className="h-8 w-8 mx-auto mb-2" />
                  <p>No courses found matching your filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCourses.map((course) => (
                    <div
                      key={course._id}
                      className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-charcoal">
                            {course.title}
                          </h3>
                          <Badge
                            className={getCategoryColor(course.category)}
                            variant="secondary"
                          >
                            {course.category}
                          </Badge>

                          <Badge
                            className={getStatusColor(course.status)}
                            variant="secondary"
                          >
                            {course.status === 'in-progress' && 'In Progress'}
                            {course.status === 'not-started' && 'Not Started'}
                            {course.status === 'completed' && 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-warm-gray mb-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-warm-gray">
                          <span>
                            {course.completedLessons} of {course.totalLessons}{' '}
                            lessons
                          </span>
                          {course.duration > 0 && (
                            <span>{formatDuration(course.duration * 60)}</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <Progress value={course.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {course.status === 'completed' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-transparent border-success-green text-success-green"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </Button>
                        ) : (
                          <Link href={`/dashboard/assignment/${course._id}`}>
                            <Button
                              size="sm"
                              className="bg-charcoal hover:bg-charcoal/90 text-alabaster"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {course.status === 'not-started'
                                ? 'Start'
                                : 'Continue'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {data && (
            <LearningProgressChart
              skillProgress={data.skillProgress}
              totalTimeInvested={data.stats.totalTimeInvested}
              completedThisMonth={data.stats.completedThisMonth}
              certificatesEarned={data.stats.certificatesEarned}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
