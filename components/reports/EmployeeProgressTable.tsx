'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface EmployeeProgressTableProps {
  data?: EmployeeProgress[];
}

export default function EmployeeProgressTable({
  data,
}: EmployeeProgressTableProps) {
  return (
    <Card className="bg-card text-card-foreground shadow-neumorphic p-4">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Employee Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>
                    <div className="w-full max-w-[150px]">
                      <Progress
                        value={employee.completionPercentage}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground text-right mt-1">
                        {employee.completionPercentage}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        employee.status === 'Completed'
                          ? 'default'
                          : employee.status === 'Overdue'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {employee.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface EmployeeProgress {
  id: string;
  name: string;
  email: string;
  department: string;
  completionPercentage: number;
  status: 'Completed' | 'In Progress' | 'Overdue' | 'Not Started';
}
