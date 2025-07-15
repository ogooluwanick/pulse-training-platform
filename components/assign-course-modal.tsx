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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Course {
  _id: string;
  title: string;
}

interface Employee {
  id: string;
  name: string;
}

interface AssignCourseModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (courseIds: string[]) => void;
}

const fetchCourses = async (): Promise<Course[]> => {
  const res = await fetch('/api/company/courses');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export default function AssignCourseModal({
  employee,
  isOpen,
  onClose,
  onAssign,
}: AssignCourseModalProps) {
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  const handleToggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleAssign = () => {
    onAssign(selectedCourses);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal">
            Assign Courses to {employee?.name}
          </DialogTitle>
          <DialogDescription className="text-warm-gray">
            Select the courses you want to assign to this employee.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 w-full rounded-md border border-warm-gray/20 p-4 bg-alabaster">
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading courses...</p>
            ) : (
              courses?.map((course) => (
                <div key={course._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={course._id}
                    checked={selectedCourses.includes(course._id)}
                    onCheckedChange={() => handleToggleCourse(course._id)}
                  />
                  <Label
                    htmlFor={course._id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-charcoal"
                  >
                    {course.title}
                  </Label>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="flex flex-row-reverse gap-2 pt-4">
          <Button
            onClick={handleAssign}
            className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
          >
            Assign Courses
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-alabaster border-warm-gray/30 min-w-[140px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
