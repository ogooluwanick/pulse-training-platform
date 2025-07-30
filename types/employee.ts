import { Key } from 'react';

export interface AssignmentDetails {
  courseId: string;
  type: 'one-time' | 'interval';
  interval?: 'daily' | 'monthly' | 'yearly';
  endDate?: Date;
}

export interface Employee {
  _id: Key | null | undefined;
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  overallProgress: number;
  coursesAssigned: number;
  coursesCompleted: number;
  lastActivity: string;
  status: 'on-track' | 'at-risk' | 'overdue';
}
