'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Users,
  Search,
  Calendar,
  TrendingUp,
  Filter,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import AssignmentDetailsModal from '@/components/course-assignment/assignment-details-modal';

interface Assignment {
  _id: string;
  course: {
    _id: string;
    title: string;
    category: 'compliance' | 'skills' | 'culture' | 'technical';
    lessons: Array<{
      _id: string;
      title: string;
      type: 'text' | 'video' | 'image';
      content: string;
      duration: number;
      quiz?: {
        title: string;
        questions: Array<{
          question: string;
          options: string[];
          answer: string;
        }>;
      };
    }>;
    finalQuiz?: {
      title: string;
      questions: Array<{
        question: string;
        options: string[];
        answer: string;
      }>;
    };
  };
  assignee: {
    _id: string;
    name: string;
    avatar: string;
    department?: string;
  };
  status: 'completed' | 'in-progress' | 'not-started';
  endDate?: string;
  progress: number;
  lessonProgress?: Array<{
    lessonId: string;
    status: 'not-started' | 'in-progress' | 'completed';
    completedAt?: string;
    quizResult?: {
      score: number;
      passed: boolean;
      answers: Array<{
        question: string;
        answer: any;
        correct: boolean;
      }>;
    };
  }>;
  finalQuizResult?: {
    score: number;
    passed: boolean;
    answers: Array<{
      question: string;
      answer: any;
      correct: boolean;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

// Fetch assignments from API with better error handling
const fetchAssignments = async (): Promise<Assignment[]> => {
  const response = await fetch('/api/course-assignment', {
    credentials: 'include', // Ensure cookies are sent
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.status === 401) {
    throw new Error('Authentication required. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch assignments: ${response.statusText}`);
  }

  return response.json();
};

export default function CourseAssignmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Assignment[]>({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (
        error instanceof Error &&
        error.message.includes('Authentication required')
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const uniqueAssignees = useMemo(() => {
    const assignees = new Map();
    assignments.forEach((a) => {
      if (!assignees.has(a.assignee._id)) {
        assignees.set(a.assignee._id, a.assignee);
      }
    });
    return Array.from(assignees.values());
  }, [assignments]);

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-success-green text-alabaster';
      case 'in-progress':
        return 'bg-warning-ochre text-alabaster';
      case 'not-started':
        return 'bg-charcoal text-alabaster';
      default:
        return 'bg-warm-gray text-alabaster';
    }
  };

  const getStatusDisplay = (status: Assignment['status']) => {
    switch (status) {
      case 'not-started':
        return 'Not Started';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.course.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.assignee.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === 'all' || assignment.status === selectedStatus;
    const matchesAssignee =
      selectedAssignee === 'all' ||
      assignment.assignee._id === selectedAssignee;

    return matchesSearch && matchesStatus && matchesAssignee;
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
          <div className="text-center">
            <p className="text-red-500 mb-2">
              Failed to load assignments. Please try again later.
            </p>
            <p className="text-sm text-warm-gray">
              {error instanceof Error
                ? error.message
                : 'Unknown error occurred'}
            </p>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-charcoal hover:bg-charcoal/90 text-alabaster"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 space-y-6 p-6"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-charcoal">
            Course Assignments
          </h1>
          <p className="text-warm-gray">
            Track and manage your team's learning progress.
          </p>
        </div>
      </div>

      <Card className="bg-card border-warm-gray/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-warm-gray" />
              <Input
                placeholder="Search by course or assignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-alabaster border-warm-gray/30 focus:border-charcoal"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-48 bg-alabaster border-warm-gray/30">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="not-started">Not Started</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedAssignee}
              onValueChange={setSelectedAssignee}
            >
              <SelectTrigger className="w-full md:w-48 bg-alabaster border-warm-gray/30">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {uniqueAssignees.map((assignee: any) => (
                  <SelectItem key={assignee._id} value={assignee._id}>
                    {assignee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAssignments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <Card
              key={assignment._id}
              className="bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft flex flex-col"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <Badge
                    className={getStatusColor(assignment.status)}
                    variant="secondary"
                  >
                    {getStatusDisplay(assignment.status)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <img
                      src={assignment.assignee.avatar}
                      alt={assignment.assignee.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <div className="text-right">
                      <div className="text-sm font-medium text-charcoal">
                        {assignment.assignee.name}
                      </div>
                      {assignment.assignee.department && (
                        <div className="text-xs text-warm-gray">
                          {assignment.assignee.department}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <CardTitle className="text-lg text-charcoal">
                  {assignment.course.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <div className="flex items-center justify-between text-sm text-warm-gray">
                  {assignment.endDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Due: {format(new Date(assignment.endDate), 'PPP')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>{assignment.progress}%</span>
                  </div>
                </div>
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-success-green h-2.5 rounded-full"
                      style={{ width: `${assignment.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-warm-gray">
                  Category: {assignment.course.category}
                </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Button
                  className="w-full bg-charcoal hover:bg-charcoal/90 text-alabaster"
                  onClick={() => setSelectedAssignment(assignment)}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-warm-gray">
            {assignments.length === 0
              ? 'No course assignments found for your company.'
              : 'No assignments match your current filters.'}
          </p>
        </div>
      )}
      <AssignmentDetailsModal
        isOpen={!!selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
      />
    </div>
  );
}
