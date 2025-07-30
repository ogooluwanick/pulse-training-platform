import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User';
import Company from '@/lib/models/Company';
import CourseAssignment from '@/lib/models/CourseAssignment';
import mongoose from 'mongoose';
import { UserRole } from '../../../../next-auth.d';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const companyId = searchParams.get('companyId');
  const courseId = searchParams.get('courseId');

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

    let totalCompletion = 0;
    let coursesInProgress = 0;
    let overdueEmployeesCount = 0;
    const courseCompletionStats: { [key: string]: { total: number; completed: number } } = {};
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

      if (assignment.status === 'in-progress') {
        coursesInProgress++;
      }

      if (new Date(assignment.dueDate) < new Date() && assignment.status !== 'completed') {
        overdueEmployeesCount++;
        employeeProgress[assignment.employee._id].status = 'Overdue';
      }

      if (!courseCompletionStats[assignment.course.title]) {
        courseCompletionStats[assignment.course.title] = { total: 0, completed: 0 };
      }
      courseCompletionStats[assignment.course.title].total++;
      if (assignment.status === 'completed') {
        courseCompletionStats[assignment.course.title].completed++;
      }
    });

    const employeeProgressList = Object.entries(employeeProgress).map(([id, data]) => {
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
        id,
        name: data.name,
        email: data.email,
        companyName: data.companyName,
        completionPercentage,
        status,
      };
    });

    const overallCompletion = assignments.length > 0 ? (assignments.filter(a => a.status === 'completed').length / assignments.length) * 100 : 0;

    const courseCompletionStatsList = Object.entries(courseCompletionStats).map(([courseName, data]) => ({
      courseName,
      completion: data.total > 0 ? (data.completed / data.total) * 100 : 0,
    }));

    return NextResponse.json({
      overallCompletion,
      coursesInProgress,
      overdueEmployeesCount,
      courseCompletionStats: courseCompletionStatsList,
      employeeProgressList,
    });
  } catch (error) {
    console.error('Error fetching admin report data:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
