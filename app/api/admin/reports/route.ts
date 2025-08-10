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

  // Get active company from session or resolve from request
  let activeCompanyId = session.user.activeCompanyId;

  // Try to get from cookie if not in session
  if (!activeCompanyId) {
    try {
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        );

        if (cookies.activeCompanyId) {
          activeCompanyId = decodeURIComponent(cookies.activeCompanyId);
        }
      }
    } catch (error) {
      console.log('Error parsing cookies:', error);
    }
  }

  // If still no active company, use the first available company
  if (
    !activeCompanyId &&
    session.user.companyIds &&
    session.user.companyIds.length > 0
  ) {
    activeCompanyId = session.user.companyIds[0];
  }

  console.log('[AdminReports] Company context:', {
    sessionActiveCompanyId: session.user.activeCompanyId,
    resolvedActiveCompanyId: activeCompanyId,
    requestedCompanyId: companyId,
    userCompanyIds: session.user.companyIds,
  });

  try {
    const match: any = {};
    if (startDate)
      match.createdAt = { ...match.createdAt, $gte: new Date(startDate) };
    if (endDate)
      match.createdAt = { ...match.createdAt, $lte: new Date(endDate) };

    // Use the active company context if no specific company is requested
    const targetCompanyId = companyId || activeCompanyId;
    if (targetCompanyId) {
      match.companyId = new mongoose.Types.ObjectId(targetCompanyId);
    }

    if (courseId) match.course = new mongoose.Types.ObjectId(courseId);

    const assignments = await CourseAssignment.find(match)
      .populate({
        path: 'employee',
        model: User,
        select: 'firstName lastName email department',
        populate: [
          {
            path: 'memberships.companyId',
            model: Company,
            select: 'name',
          },
          {
            path: 'activeCompanyId',
            model: Company,
            select: 'name',
          },
        ],
      })
      .populate({
        path: 'course',
        model: Course,
        select: 'title',
        match: {}, // No status filter for admin users
      });

    let totalCompletion = 0;
    let coursesInProgress = 0;
    let overdueEmployeesCount = 0;
    const courseCompletionStats: {
      [key: string]: { total: number; completed: number };
    } = {};
    const employeeProgress: {
      [key: string]: {
        completed: number;
        total: number;
        name: string;
        email: string;
        companyName: string;
        status: string;
      };
    } = {};

    assignments.forEach((assignment) => {
      // Get company name from active company or memberships
      const employee = assignment.employee as any;
      const activeMembership = employee.memberships?.find(
        (m: any) => m.status === 'active'
      );
      const companyName =
        employee.activeCompanyId?.name ||
        activeMembership?.companyId?.name ||
        'No Company';

      if (!employeeProgress[assignment.employee._id]) {
        employeeProgress[assignment.employee._id] = {
          completed: 0,
          total: 0,
          name: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
          email: assignment.employee.email,
          companyName: companyName,
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

      // Check for overdue using standardized rules: courses assigned more than 14 days ago that aren't completed
      const now = new Date();
      if (assignment.status !== 'completed' && assignment.createdAt) {
        const assignedDate = new Date(assignment.createdAt);
        const diffDays =
          (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays > 14) {
          overdueEmployeesCount++;
          employeeProgress[assignment.employee._id].status = 'Overdue';
        }
      }

      if (!courseCompletionStats[assignment.course.title]) {
        courseCompletionStats[assignment.course.title] = {
          total: 0,
          completed: 0,
        };
      }
      courseCompletionStats[assignment.course.title].total++;
      if (assignment.status === 'completed') {
        courseCompletionStats[assignment.course.title].completed++;
      }
    });

    const employeeProgressList = Object.entries(employeeProgress).map(
      ([id, data]) => {
        const completionPercentage =
          data.total > 0 ? (data.completed / data.total) * 100 : 0;
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
      }
    );

    const overallCompletion =
      assignments.length > 0
        ? (assignments.filter((a) => a.status === 'completed').length /
            assignments.length) *
          100
        : 0;

    const courseCompletionStatsList = Object.entries(courseCompletionStats).map(
      ([courseName, data]) => ({
        courseName,
        completion: data.total > 0 ? (data.completed / data.total) * 100 : 0,
      })
    );

    return NextResponse.json({
      overallCompletion,
      coursesInProgress,
      overdueEmployeesCount,
      courseCompletionStats: courseCompletionStatsList,
      employeeProgressList,
    });
  } catch (error) {
    console.error('Error fetching admin report data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
