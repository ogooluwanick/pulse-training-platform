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
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  overallProgress: number;
  coursesAssigned: number;
  coursesCompleted: number;
  lastActivity: string;
  status: 'on-track' | 'at-risk' | 'overdue';
}

interface EditEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => void;
}

export default function EditEmployeeModal({
  employee,
  isOpen,
  onClose,
  onSave,
}: EditEmployeeModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setDepartment(employee.department);
    }
  }, [employee]);

  const handleSave = () => {
    if (employee) {
      onSave({ ...employee, name, email, department });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-parchment border-warm-gray/20 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-charcoal">
            Edit Employee
          </DialogTitle>
          <DialogDescription className="text-warm-gray">
            Update the details for{' '}
            <span className="capitalize">{employee?.name}.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2 px-1">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-charcoal font-medium">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-charcoal font-medium">
              Email
            </Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
              placeholder="Enter email address"
              type="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department" className="text-charcoal font-medium">
              Department
            </Label>
            <Input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-alabaster border-warm-gray/30 focus:border-charcoal"
              placeholder="Enter department"
            />
          </div>
        </div>
        <DialogFooter className="flex flex-row-reverse gap-2 pt-4">
          <Button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-charcoal text-white hover:text-white hover:bg-charcoal/90 transition-colors"
          >
            Save Changes
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-alabaster border-warm-gray/30 min-w-[120px]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
