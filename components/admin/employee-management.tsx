'use client';

import { Key, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
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
import FullPageLoader from '@/components/full-page-loader';
import EditEmployeeModal from '@/components/edit-employee-modal';
import AssignCourseModal from '@/components/assign-course-modal';
import MassAssignCourseModal from '@/components/mass-assign-course-modal';
import { Employee, AssignmentDetails } from '@/types/employee';

const updateEmployee = async (employee: Employee): Promise<Employee> => {
  const res = await fetch(`/api/employee/${employee._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(employee),
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const assignCourses = async ({
  employeeId,
  assignments,
}: {
  employeeId: string;
  assignments: AssignmentDetails[];
}) => {
  const res = await fetch(`/api/employee/${employeeId}/assign-courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ assignments }),
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const massAssignCourses = async ({
  employeeIds,
  assignments,
}: {
  employeeIds: string[];
  assignments: AssignmentDetails[];
}) => {
  const res = await fetch(`/api/employee/mass-assign-courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeIds, assignments }),
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const fetchEmployees = async (): Promise<Employee[]> => {
  const res = await fetch('/api/admin/employees');
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const getStatusColor = (status: Employee['status']) => {
  switch (status) {
    case 'on-track':
      return 'bg-success-green text-alabaster hover:bg-success-green/90';
    case 'at-risk':
      return 'bg-warning-ochre text-alabaster hover:bg-warning-ochre/90';
    case 'overdue':
      return 'bg-red-500 text-alabaster hover:bg-red-500/90';
    default:
      return 'bg-warm-gray text-alabaster hover:bg-warm-gray/90';
  }
};

export default function EmployeeManagement() {
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isMassAssignModalOpen, setIsMassAssignModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const {
    data: employees,
    isLoading,
    error,
  } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  });

  const updateMutation = useMutation({
    mutationFn: updateEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsEditModalOpen(false);
      toast.success('Employee updated successfully!');
    },
    onError: () => {
      toast.error('Failed to update employee.');
    },
  });

  const assignMutation = useMutation({
    mutationFn: assignCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsAssignModalOpen(false);
      toast.success('Courses assigned successfully!');
    },
    onError: () => {
      toast.error('Failed to assign courses.');
    },
  });

  const massAssignMutation = useMutation({
    mutationFn: massAssignCourses,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setIsMassAssignModalOpen(false);
      toast.success('Courses assigned successfully!');
    },
    onError: () => {
      toast.error('Failed to assign courses.');
    },
  });

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditModalOpen(true);
  };

  const handleSave = (employee: Employee) => {
    updateMutation.mutate(employee);
  };

  const handleAssignClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsAssignModalOpen(true);
  };

  const handleAssign = (assignments: AssignmentDetails[]) => {
    if (selectedEmployee?._id) {
      assignMutation.mutate({
        employeeId: String(selectedEmployee._id),
        assignments,
      });
    }
  };

  const handleMassAssign = (
    employeeIds: string[],
    assignments: AssignmentDetails[]
  ) => {
    massAssignMutation.mutate({ employeeIds, assignments });
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div
        className="flex-1 space-y-6 p-6 min-h-screen"
        style={{ backgroundColor: '#f5f4ed' }}
      >
        <Card className="bg-card border-warm-gray/20">
          <CardHeader>
            <CardTitle className="text-charcoal">Employee Management</CardTitle>
            <CardDescription className="text-warm-gray">
              Manage all employees on the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-500">Could not load employees.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="flex-1 space-y-6 p-6 min-h-screen"
      style={{ backgroundColor: '#f5f4ed' }}
    >
      <Card className="bg-card border-warm-gray/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-charcoal">Employee Management</CardTitle>
            <CardDescription className="text-warm-gray">
              Manage all employees on the platform
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsMassAssignModalOpen(true)}
            className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
          >
            Mass Assign Courses
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employees?.map((employee) => (
              <div
                key={employee._id}
                className="flex items-center gap-4 p-4 rounded-lg bg-alabaster border border-warm-gray/20"
              >
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="font-medium text-charcoal truncate capitalize">
                      {`${employee.firstName || '-'} ${employee.lastName || '-'}`}
                    </p>
                    <p className="text-sm text-warm-gray truncate">
                      {employee.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Department</p>
                    <p className="text-sm text-charcoal">
                      {employee.department || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Progress</p>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={employee.overallProgress || 0}
                        className="flex-1 h-2"
                      />
                      <span className="text-sm text-charcoal">
                        {Math.round(employee.overallProgress || 0)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-warm-gray">Status</p>
                    <Badge
                      className={`capitalize ${getStatusColor(employee.status)}`}
                      variant="secondary"
                    >
                      {employee.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
                    onClick={() => handleEditClick(employee)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-warm-gray/30"
                    onClick={() => handleAssignClick(employee)}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <EditEmployeeModal
        employee={selectedEmployee}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
      <AssignCourseModal
        employee={selectedEmployee}
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleAssign}
        isAssigning={assignMutation.isPending}
      />
      <MassAssignCourseModal
        employees={employees || []}
        isOpen={isMassAssignModalOpen}
        onClose={() => setIsMassAssignModalOpen(false)}
        onAssign={handleMassAssign}
        isAssigning={massAssignMutation.isPending}
      />
    </div>
  );
}
