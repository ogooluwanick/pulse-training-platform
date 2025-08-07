'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Star } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Checkbox } from './ui/checkbox';
import { formatDuration } from '@/lib/duration';
import { Calendar } from '@/components/ui/calendar';
import { Employee, AssignmentDetails } from '@/types/employee';

interface Course {
  _id: string;
  title: string;
  description: string;
  // instructor: { firstName?: string; name?: string } | string;
  duration: number;
  category: 'compliance' | 'skills' | 'culture' | 'technical' | 'General';
  // rating: number;
  // averageRating?: number;
  // totalRatings?: number;
  enrolledCount: number;
  tags: string[];
}

interface MassAssignCourseModalProps {
  employees: Employee[];
  isOpen: boolean;
  onClose: () => void;
  onAssign: (employeeIds: string[], assignments: AssignmentDetails[]) => void;
}

const fetchCourses = async (): Promise<Course[]> => {
  const res = await fetch('/api/company/courses');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};



const getCategoryColor = (category: Course['category']) => {
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

export default function MassAssignCourseModal({
  employees,
  isOpen,
  onClose,
  onAssign,
  isAssigning,
}: MassAssignCourseModalProps & { isAssigning?: boolean }) {
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedAssignments, setSelectedAssignments] = useState<
    AssignmentDetails[]
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { data: courses, isLoading: isLoadingCourses } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  useEffect(() => {
    if (isOpen) {
      setSelectedEmployeeIds([]);
      setSelectedAssignments([]);
      // Debug: Log employee data structure
      console.log('Employees data structure:', employees);
      const debugEmployees = Array.isArray(employees) ? employees : [];
      if (debugEmployees && debugEmployees.length > 0) {
        console.log('First employee structure:', debugEmployees[0]);
      }
    }
  }, [isOpen, employees]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployeeIds(
        safeEmployees.map((e) => e.id || String(e._id) || '').filter(Boolean)
      );
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectCourse = (courseId: string) => {
    const existingAssignment = selectedAssignments.find(
      (a) => a.courseId === courseId
    );
    if (existingAssignment) {
      setSelectedAssignments(
        selectedAssignments.filter((a) => a.courseId !== courseId)
      );
    } else {
      setSelectedAssignments([
        ...selectedAssignments,
        { courseId, type: 'one-time' },
      ]);
    }
  };

  const handleAssignmentTypeChange = (
    courseId: string,
    type: 'one-time' | 'interval'
  ) => {
    setSelectedAssignments(
      selectedAssignments.map((a) =>
        a.courseId === courseId
          ? { ...a, type, interval: undefined, endDate: undefined }
          : a
      )
    );
  };

  const handleIntervalChange = (
    courseId: string,
    interval: 'daily' | 'monthly' | 'yearly'
  ) => {
    setSelectedAssignments(
      selectedAssignments.map((a) =>
        a.courseId === courseId ? { ...a, interval } : a
      )
    );
  };

  const handleEndDateChange = (courseId: string, date?: Date) => {
    setSelectedAssignments(
      selectedAssignments.map((a) =>
        a.courseId === courseId ? { ...a, endDate: date } : a
      )
    );
  };

  const handleAssign = () => {
    onAssign(selectedEmployeeIds, selectedAssignments);
  };

  const filteredCourses = courses?.filter((course) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ensure employees is always an array
  const safeEmployees = Array.isArray(employees) ? employees : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl text-charcoal font-bold">
            Mass Assign Courses
          </DialogTitle>
          <DialogDescription className="text-warm-gray">
            Select employees and courses to assign.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto md:overflow-hidden">
          <div className="md:col-span-1 flex flex-col overflow-y-auto">
            <h3 className="text-lg font-medium text-charcoal mb-2 sticky top-0 bg-parchment z-10 pt-2">
              Employees
            </h3>
            <div className="flex items-center space-x-2 mb-4 sticky top-10 bg-parchment z-10 pb-2">
              <Checkbox
                id="select-all"
                onCheckedChange={handleSelectAll}
                checked={
                  safeEmployees.length > 0 &&
                  selectedEmployeeIds.length === safeEmployees.length
                }
              />
              <label htmlFor="select-all">Select All</label>
            </div>
            <ScrollArea className="flex-grow rounded-md border border-warm-gray/20 p-4 bg-alabaster">
              <div className="space-y-2">
                {safeEmployees.map((employee) => {
                  const employeeId = String(employee.id || employee._id || '');
                  return (
                    <div
                      key={employeeId}
                      className="flex items-center space-x-2 w-full"
                    >
                      <Checkbox
                        id={employeeId}
                        onCheckedChange={() => handleSelectEmployee(employeeId)}
                        checked={selectedEmployeeIds.includes(employeeId)}
                      />
                      <div className="flex flex-col overflow-hidden flex-1">
                        <span className="capitalize font-medium text-charcoal">
                          {employee.name ||
                            `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
                            'Unknown Employee'}
                        </span>
                        <span className="text-sm text-warm-gray truncate">
                          {employee.email || 'No email'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
          <div className="md:col-span-2 flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-parchment z-10 pt-2 pb-2">
              <h3 className="text-lg font-medium text-charcoal mb-2">
                Courses
              </h3>
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <ScrollArea className="flex-grow w-full rounded-md border border-warm-gray/20 p-4 bg-alabaster">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
                {isLoadingCourses ? (
                  <p>Loading courses...</p>
                ) : (
                  filteredCourses?.map((course) => {
                    const assignment = selectedAssignments.find(
                      (a) => a.courseId === course._id
                    );
                    const isSelected = !!assignment;

                    return (
                      <motion.div
                        key={course._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card
                          onClick={() => handleSelectCourse(course._id)}
                          className={`cursor-pointer transition-all duration-300 flex flex-col h-full ${
                            isSelected
                              ? 'ring-2 ring-charcoal bg-charcoal/10'
                              : 'bg-card border-warm-gray/20 shadow-soft hover:shadow-soft-lg transition-soft'
                          }`}
                        >
                          <CardHeader className="space-y-4">
                            <div className="flex items-start justify-between">
                              <Badge
                                className={getCategoryColor(course.category)}
                                variant="outline"
                              >
                                {course.category.charAt(0).toUpperCase() +
                                  course.category.slice(1)}
                              </Badge>

                            </div>
                            <div>
                              <CardTitle className="text-lg text-charcoal">
                                {course.title}
                              </CardTitle>
                              <CardDescription className="text-warm-gray mt-2 text-sm">
                                {course.description}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between text-sm text-warm-gray">
                                {/* <span>
                                  By{' '}
                                  {typeof course.instructor === 'object'
                                    ? course.instructor?.firstName ||
                                      'Pulse Platform'
                                    : course.instructor || 'Pulse Platform'}
                                </span> */}
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
                              <div className="flex items-center gap-4 text-sm text-warm-gray mt-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatDuration(course.duration)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {(
                                      course.enrolledCount || 0
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-4">
                                {(course.tags || []).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs bg-alabaster border-warm-gray/30"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            {isSelected && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2 mt-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Select
                                  onValueChange={(
                                    value: 'one-time' | 'interval'
                                  ) =>
                                    handleAssignmentTypeChange(
                                      course._id,
                                      value
                                    )
                                  }
                                  defaultValue={assignment.type}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Assignment Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="one-time">
                                      One-time
                                    </SelectItem>
                                    <SelectItem value="interval">
                                      Interval
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                {assignment.type === 'interval' && (
                                  <>
                                    <Select
                                      onValueChange={(
                                        value: 'daily' | 'monthly' | 'yearly'
                                      ) =>
                                        handleIntervalChange(course._id, value)
                                      }
                                      defaultValue={assignment.interval}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Interval" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="daily">
                                          Daily
                                        </SelectItem>
                                        <SelectItem value="monthly">
                                          Monthly
                                        </SelectItem>
                                        <SelectItem value="yearly">
                                          Yearly
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant={'outline'}
                                          className="w-full justify-start text-left font-normal"
                                        >
                                          {assignment.endDate ? (
                                            format(assignment.endDate, 'PPP')
                                          ) : (
                                            <span>Pick an end date</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <div className="p-3">
                                          <Calendar
                                            mode="single"
                                            captionLayout="dropdown-buttons"
                                            selected={assignment.endDate}
                                            onSelect={(
                                              date: Date | undefined
                                            ) =>
                                              handleEndDateChange(
                                                course._id,
                                                date
                                              )
                                            }
                                            initialFocus
                                          />
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </>
                                )}
                              </motion.div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter className="flex flex-row-reverse gap-2 pt-4">
          <Button
            onClick={handleAssign}
            className="px-6 py-3 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors text-lg"
            disabled={
              selectedEmployeeIds.length === 0 ||
              selectedAssignments.length === 0 ||
              isAssigning
            }
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Courses'
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-alabaster border-warm-gray/30 min-w-[160px] text-lg"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
