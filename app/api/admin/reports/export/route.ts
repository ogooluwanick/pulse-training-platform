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

  const { startDate, endDate, companyId, courseId, format } =
    await request.json();

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

  console.log('[AdminReportsExport] Company context:', {
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

      if (
        new Date(assignment.dueDate) < new Date() &&
        assignment.status !== 'completed'
      ) {
        employeeProgress[assignment.employee._id].status = 'Overdue';
      }

      // Check for overdue using standardized rules: courses assigned more than 14 days ago that aren't completed
      const now = new Date();
      if (assignment.status !== 'completed' && assignment.createdAt) {
        const assignedDate = new Date(assignment.createdAt);
        const diffDays =
          (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays > 14) {
          employeeProgress[assignment.employee._id].status = 'Overdue';
        }
      }
    });

    const exportData = Object.values(employeeProgress).map((data) => {
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
        Name: data.name,
        Email: data.email,
        Company: data.companyName,
        'Courses Assigned': data.total,
        'Progress (%)': completionPercentage.toFixed(1),
        Status: status,
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
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
