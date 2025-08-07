'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import FullPageLoader from '@/components/full-page-loader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Award, Users, Star, Search, Play, Heart } from 'lucide-react';
import Link from 'next/link';
import { formatDuration } from '@/lib/duration';

import { toast } from 'react-hot-toast';

interface Course {
  _id: string;
  title: string;
  description: string;
  // instructor: { firstName?: string; name?: string } | string;
  duration: number;
  category?: 'compliance' | 'skills' | 'culture' | 'technical';
  // rating: number;
  // averageRating?: number;
  // totalRatings?: number;
  enrolledCount: number;
  tags: string[];
  isEnrolled: boolean;
  isSaved?: boolean;
}

interface AssignedCourse {
  _id: string;
  course: {
    _id: string;
    title: string;
    description: string;
    category?: 'compliance' | 'skills' | 'culture' | 'technical';

    duration: number;
    lessons: any[];
    finalQuiz: any;
    tags: string[];
  };
  assignee: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
    department?: string;
  };
  status: string;
  assignmentType: string;
  interval?: string;
  endDate?: string;
  progress: number;
  lessonProgress: any[];
  finalQuizResult?: any;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export default function CourseCatalogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedCourses, setSavedCourses] = useState<string[]>([]);

  const queryClient = useQueryClient();

  const {
    data: courses = [],
    isLoading,
    isError,
  } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await fetch('/api/course');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      const data = await response.json();
      return data.courses;
    },
  });

  // Fetch saved courses
  const { data: savedCoursesData } = useQuery({
    queryKey: ['savedCourses'],
    queryFn: async () => {
      const response = await fetch('/api/company/courses/save');
      if (!response.ok) {
        throw new Error('Failed to fetch saved courses');
      }
      return response.json();
    },
  });

  useEffect(() => {
    if (savedCoursesData?.savedCourses) {
      setSavedCourses(
        savedCoursesData.savedCourses.map((id: string | number) =>
          id.toString()
        )
      );
    }
  }, [savedCoursesData]);

  // Save/Unsave course mutation
  const saveCourse = useMutation({
    mutationFn: async ({
      courseId,
      save,
    }: {
      courseId: string;
      save: boolean;
    }) => {
      console.log('Frontend: Attempting to save course:', {
        courseId,
        save,
        type: typeof courseId,
      }); // Debug log

      const url = save
        ? '/api/company/courses/save'
        : `/api/company/courses/save?courseId=${courseId}`;

      console.log('Frontend: Request URL:', url); // Debug log
      console.log(
        'Frontend: Request body:',
        save ? JSON.stringify({ courseId }) : 'No body'
      ); // Debug log

      const response = await fetch(url, {
        method: save ? 'POST' : 'DELETE',
        headers: save ? { 'Content-Type': 'application/json' } : {},
        body: save ? JSON.stringify({ courseId }) : undefined,
      });

      console.log('Frontend: Response status:', response.status); // Debug log

      if (!response.ok) {
        const error = await response.json();
        console.error('Frontend: API Error:', error); // Debug log
        throw new Error(error.message || 'Failed to update saved course');
      }

      const result = await response.json();
      console.log('Frontend: Success response:', result); // Debug log
      return result;
    },
    onSuccess: (data, variables) => {
      const { courseId, save } = variables;

      if (save) {
        setSavedCourses((prev) => [...prev, courseId]);
        toast.success('Course saved to your interests!');
      } else {
        setSavedCourses((prev) => prev.filter((id) => id !== courseId));
        toast.success('Course removed from saved courses');
      }

      // Refresh saved courses data
      queryClient.invalidateQueries({ queryKey: ['savedCourses'] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update course'
      );
    },
  });

  const handleToggleSave = (courseId: string) => {
    const isSaved = savedCourses.includes(courseId);
    saveCourse.mutate({ courseId, save: !isSaved });
  };

  const { data: assignedCourses = [] } = useQuery<AssignedCourse[]>({
    queryKey: ['assignedCourses'],
    queryFn: async () => {
      const response = await fetch('/api/course-assignment');
      if (!response.ok) {
        throw new Error('Failed to fetch assigned courses');
      }
      return response.json();
    },
  });

  // const getInstructorName = (instructor: Course['instructor']): string => {
  //   if (typeof instructor === 'string') {
  //     return instructor;
  //   }
  //   return instructor?.firstName || instructor?.name || 'Pulse Platform';
  // };

  const getCategoryColor = (category: Course['category']) => {
    if (!category) {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
    switch (category) {
      case 'compliance':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'skills':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'culture':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'technical':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === 'all' || course.category === selectedCategory;

    const matchesSaved = !showSavedOnly || savedCourses.includes(course._id);

    return matchesSearch && matchesCategory && matchesSaved;
  });

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (isError) {
    return (
      <div
        className="flex-1 space-y-6 p-6"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <div className="flex items-center justify-center h-full">
          <p className="text-red-500">
            Failed to load courses. Please try again later.
          </p>
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
          <h1 className="text-3xl font-bold text-charcoal">Course Catalog</h1>
          <p className="text-warm-gray">
            Discover and assign courses to your staff
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-card border-warm-gray/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
              <Input
                placeholder="Search courses, topics, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48 bg-alabaster border-warm-gray/30">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="skills">Skills</SelectItem>
                <SelectItem value="culture">Culture</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showSavedOnly ? 'default' : 'outline'}
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`w-full md:w-auto ${
                showSavedOnly
                  ? 'bg-charcoal hover:bg-charcoal/90 text-alabaster'
                  : 'border-warm-gray/30 bg-transparent hover:bg-warm-gray/5 text-warm-gray'
              }`}
            >
              <Heart
                className={`h-4 w-4 mr-2 ${showSavedOnly ? 'fill-current' : ''}`}
              />
              {showSavedOnly ? 'Show All' : 'Saved Only'}
              {savedCourses.length > 0 && (
                <Badge variant="secondary" className="ml-2 bg-warm-gray/20">
                  {savedCourses.length}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-card border-warm-gray/20">
          <TabsTrigger value="all" className="data-[state=active]:bg-alabaster">
            All Courses
          </TabsTrigger>
          <TabsTrigger
            value="enrolled"
            className="data-[state=active]:bg-alabaster"
          >
            Assigned Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {filteredCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const isSaved = savedCourses.includes(course._id);

                return (
                  <Card
                    key={course._id}
                    className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                  >
                    <CardHeader className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Badge
                          className={getCategoryColor(course.category)}
                          variant="outline"
                        >
                          {course.category
                            ? course.category.charAt(0).toUpperCase() +
                              course.category.slice(1)
                            : 'Unknown'}
                        </Badge>
                      </div>
                      <div>
                        <CardTitle className="text-lg text-charcoal">
                          {course.title}
                        </CardTitle>
                        <CardDescription className="text-warm-gray mt-2">
                          {course.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-warm-gray">
                        {/* <span>By {getInstructorName(course.instructor)}</span> */}
                        {/* <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-warning-ochre text-warning-ochre" />
                          <span>
                            {course.averageRating
                              ? course.averageRating.toFixed(1)
                              : '0.0'}
                          </span>
                          <span className="text-xs">
                            ({course.totalRatings || 0})
                          </span>
                        </div> */}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-warm-gray">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(course.duration)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>
                            {(course.enrolledCount || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {course.tags.map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs bg-alabaster border-warm-gray/30"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {course.isEnrolled ? (
                          <Link
                            href={`/dashboard/course/${course._id}`}
                            className="flex-1"
                          >
                            <Button className="w-full bg-success-green hover:bg-success-green/90 text-alabaster">
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </Button>
                          </Link>
                        ) : (
                          <Link
                            href={`/dashboard/course/try-out/${course._id}`}
                            className="flex-1"
                          >
                            <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster">
                              <Play className="h-4 w-4 mr-2" />
                              Try It
                            </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          className={`bg-transparent border-warm-gray/30 hover:border-warning-ochre/50 transition-colors ${
                            isSaved
                              ? 'text-warning-ochre border-warning-ochre/50 bg-warning-ochre/10'
                              : 'text-warm-gray hover:text-warning-ochre'
                          }`}
                          onClick={() => handleToggleSave(course._id)}
                          disabled={saveCourse.isPending}
                        >
                          <Award
                            className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`}
                          />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-warm-gray">
                {showSavedOnly
                  ? 'No saved courses found.'
                  : 'No courses found.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-6">
          {assignedCourses.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assignedCourses.map((assignment) => (
                <Card
                  key={assignment._id}
                  className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft"
                >
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <Badge
                        className={getCategoryColor(assignment.course.category)}
                        variant="outline"
                      >
                        {assignment.course.category
                          ? assignment.course.category.charAt(0).toUpperCase() +
                            assignment.course.category.slice(1)
                          : 'Unknown'}
                      </Badge>
                    </div>
                    <div>
                      <CardTitle className="text-lg text-charcoal">
                        {assignment.course.title}
                      </CardTitle>
                      <CardDescription className="text-warm-gray mt-2">
                        {assignment.course.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-warm-gray">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-charcoal/10 flex items-center justify-center">
                          <span className="text-xs font-medium text-charcoal">
                            {assignment.assignee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-charcoal">
                          {assignment.assignee.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success-green"></div>
                        <span className="text-xs">{assignment.progress}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-warm-gray">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDuration(assignment.course.duration)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{assignment.course.lessons.length} lessons</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between !mb-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          assignment.status === 'completed'
                            ? 'bg-success-green/10 text-success-green border-success-green/20'
                            : assignment.status === 'in_progress'
                              ? 'bg-warning-ochre/10 text-warning-ochre border-warning-ochre/20'
                              : 'bg-warm-gray/10 text-warm-gray border-warm-gray/20'
                        }`}
                      >
                        {assignment.status === 'completed'
                          ? 'Completed'
                          : assignment.status === 'in_progress'
                            ? 'In Progress'
                            : 'Not Started'}
                      </Badge>
                      <span className="text-xs text-warm-gray">
                        {new Date(assignment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/course/view/${assignment.course._id}?assignmentId=${assignment._id}`}
                        className="flex-1"
                      >
                        <Button className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster">
                          <Play className="h-4 w-4 mr-2" />
                          View Assignment
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-warm-gray">
                You have not assigned any courses yet.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
