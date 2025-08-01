import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Course from '@/lib/models/Course';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';

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

    const user = session.user as any;
    const companyId = new mongoose.Types.ObjectId(user.companyId);

    const filters: ExportFilters = await request.json();

    // Get company with populated employees
    const company = await Company.findById(companyId).populate({
      path: 'employees',
      model: User,
    });

    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const employees = company.employees as any[];
    let filteredEmployees = employees;

    // Apply department filter
    if (filters.department && filters.department !== 'all') {
      filteredEmployees = employees.filter(
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
      .populate('course', 'title lessons')
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

        // Determine status
        let status: 'Completed' | 'In Progress' | 'Overdue' | 'Not Started' =
          'Not Started';

        const hasOverdueAssignments = employeeData.assignments.some(
          (assignment: any) =>
            assignment.endDate &&
            new Date(assignment.endDate) < currentDate &&
            assignment.status !== 'completed'
        );

        const hasCompletedAssignments = employeeData.assignments.some(
          (assignment: any) => assignment.status === 'completed'
        );

        const hasInProgressAssignments = employeeData.assignments.some(
          (assignment: any) => assignment.status === 'in-progress'
        );

        if (hasOverdueAssignments) {
          status = 'Overdue';
        } else if (completionPercentage === 100 && hasCompletedAssignments) {
          status = 'Completed';
        } else if (hasInProgressAssignments || completionPercentage > 0) {
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
