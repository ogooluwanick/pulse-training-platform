import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import User from '@/lib/models/User';
import Company from '@/lib/models/Company';
import Course from '@/lib/models/Course';
import mongoose from 'mongoose';
import Papa from 'papaparse';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const { startDate, endDate, companyId, courseId, format } = await request.json();

  try {
    const match: any = {};
    if (startDate) match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
    if (endDate) match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };
    if (companyId) match.company = new mongoose.Types.ObjectId(companyId);
    if (courseId) match.course = new mongoose.Types.ObjectId(courseId);

    const assignments = await CourseAssignment.find(match)
      .populate({
        path: 'employee',
        model: User,
        populate: {
          path: 'company',
          model: Company,
        },
      })
      .populate('course', 'title');

    const employeeProgress: { [key: string]: { completed: number; total: number; name: string; email: string; companyName: string; status: string } } = {};

    assignments.forEach(assignment => {
      if (!employeeProgress[assignment.employee._id]) {
        employeeProgress[assignment.employee._id] = {
          completed: 0,
          total: 0,
          name: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
          email: assignment.employee.email,
          companyName: assignment.employee.company.name,
          status: 'Not Started',
        };
      }
      employeeProgress[assignment.employee._id].total++;

      if (assignment.status === 'completed') {
        employeeProgress[assignment.employee._id].completed++;
      }

      if (new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed') {
        employeeProgress[assignment.employee._id].status = 'Overdue';
      }
    });

    const exportData = Object.values(employeeProgress).map(data => {
      const completionPercentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
      let status = 'Not Started';
      if (completionPercentage === 100) {
        status = 'Completed';
      } else if (completionPercentage > 0) {
        status = 'In Progress';
      }
      if (data.status === 'Overdue') {
        status = 'Overdue';
      }
      return {
        'Name': data.name,
        'Email': data.email,
        'Company': data.companyName,
        'Courses Assigned': data.total,
        'Progress (%)': completionPercentage.toFixed(2),
        'Status': status,
      };
    });

    if (format === 'csv') {
      const csv = Papa.unparse(exportData);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="platform-progress-report-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      return NextResponse.json({ data: exportData });
    }

    return NextResponse.json({ message: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting admin report data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
