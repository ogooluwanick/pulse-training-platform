import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';
import { getCompanyEmployees, requireCompanyContext } from '@/lib/user-utils';

export const dynamic = 'force-dynamic';

interface ExportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  courseId?: string;
  format: 'csv' | 'pdf';
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const activeCompanyId = await requireCompanyContext(session);
    const companyId = new mongoose.Types.ObjectId(activeCompanyId);

    const filters: ExportFilters = await request.json();

    // Employees via memberships
    let filteredEmployees = await getCompanyEmployees(activeCompanyId);

    // Apply department filter
    if (filters.department && filters.department !== 'all') {
      filteredEmployees = filteredEmployees.filter(
        (emp) => emp.department === filters.department
      );
    }

    const employeeIds = filteredEmployees.map((emp) => emp._id);

    // Build course assignment query
    let assignmentQuery: any = {
      employee: { $in: employeeIds },
      companyId: companyId,
    };

    // Apply course filter
    if (filters.courseId && filters.courseId !== 'all') {
      assignmentQuery.course = new mongoose.Types.ObjectId(filters.courseId);
    }

    // Apply date filter if provided
    if (filters.startDate || filters.endDate) {
      assignmentQuery.createdAt = {};
      if (filters.startDate) {
        assignmentQuery.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        assignmentQuery.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Get filtered assignments with populated course data
    const assignments = await CourseAssignment.find(assignmentQuery)
      .populate({
        path: 'course',
        model: Course,
        select: 'title lessons',
        match: {}, // No status filter for company users
      })
      .populate('employee', 'firstName lastName email department');

    // Calculate detailed employee progress for export
    const employeeProgressMap = new Map();
    const currentDate = new Date();

    for (const assignment of assignments) {
      const employeeId = assignment.employee._id.toString();
      const employee = assignment.employee;

      if (!employeeProgressMap.has(employeeId)) {
        employeeProgressMap.set(employeeId, {
          id: employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department || 'No Department',
          assignments: [],
          totalLessons: 0,
          completedLessons: 0,
          courses: [],
        });
      }

      const employeeData = employeeProgressMap.get(employeeId);
      employeeData.assignments.push(assignment);
      employeeData.courses.push(assignment.course.title);

      // Calculate lesson progress
      if (assignment.course && assignment.course.lessons) {
        const totalLessons = assignment.course.lessons.length;
        const completedLessons = assignment.lessonProgress
          ? assignment.lessonProgress.filter(
              (lesson: any) => lesson.status === 'completed'
            ).length
          : 0;

        employeeData.totalLessons += totalLessons;
        employeeData.completedLessons += completedLessons;
      }
    }

    // Generate detailed export data
    const exportData = Array.from(employeeProgressMap.values()).map(
      (employeeData) => {
        const completionPercentage =
          employeeData.totalLessons > 0
            ? Math.round(
                (employeeData.completedLessons / employeeData.totalLessons) *
                  100
              )
            : 0;

        // Determine status using standardized rules
        let status: 'Completed' | 'In Progress' | 'Overdue' | 'Not Started' =
          'Not Started';

        const now = new Date();

        // Check for overdue: courses assigned more than 14 days ago that aren't completed
        const overdueAssignments = employeeData.assignments.filter(
          (assignment: any) => {
            if (assignment.status === 'completed') return false;
            if (!assignment.createdAt) return false;

            const assignedDate = new Date(assignment.createdAt);
            const diffDays =
              (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
            return diffDays > 14;
          }
        );

        // Check for at-risk: overall progress less than 50% after 5 days
        const atRiskAssignments = employeeData.assignments.filter(
          (assignment: any) => {
            if (assignment.status === 'completed') return false;
            if (!assignment.createdAt) return false;

            const assignedDate = new Date(assignment.createdAt);
            const diffDays =
              (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);

            // Only consider at-risk if assignment is older than 5 days
            if (diffDays <= 5) return false;

            // Calculate progress for this assignment
            const courseData = assignment.course;
            if (!courseData || !courseData.lessons) return false;

            const courseLessons = courseData.lessons.length;
            const completedLessons = assignment.lessonProgress
              ? assignment.lessonProgress.filter(
                  (lesson: any) => lesson.status === 'completed'
                ).length
              : 0;

            const assignmentProgress =
              courseLessons > 0 ? (completedLessons / courseLessons) * 100 : 0;
            return assignmentProgress < 50;
          }
        );

        // Determine status
        if (overdueAssignments.length > 0) {
          status = 'Overdue';
        } else if (
          completionPercentage === 100 &&
          employeeData.assignments.some((a: any) => a.status === 'completed')
        ) {
          status = 'Completed';
        } else if (atRiskAssignments.length > 0 || completionPercentage > 0) {
          status = 'In Progress';
        }

        return {
          Name: employeeData.name,
          Email: employeeData.email,
          Department: employeeData.department,
          'Courses Assigned': employeeData.courses.join(', '),
          'Total Lessons': employeeData.totalLessons,
          'Completed Lessons': employeeData.completedLessons,
          'Progress (%)': completionPercentage,
          Status: status,
          'Export Date': new Date().toLocaleDateString(),
        };
      }
    );

    // Sort by progress (highest first)
    exportData.sort((a, b) => b['Progress (%)'] - a['Progress (%)']);

    if (filters.format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map((row) =>
          headers
            .map((header) => `"${row[header as keyof typeof row]}"`)
            .join(',')
        ),
      ].join('\n');

      const filename = `employee-progress-report-${new Date().toISOString().split('T')[0]}.csv`;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (filters.format === 'pdf') {
      // For PDF, we'll return the data and let the frontend handle PDF generation
      // This is because server-side PDF generation requires additional setup
      return NextResponse.json({
        data: exportData,
        message: 'PDF data prepared for client-side generation',
      });
    }

    return NextResponse.json(
      { message: 'Invalid export format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error exporting report data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
