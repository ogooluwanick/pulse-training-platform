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

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  department?: string;
  courseId?: string;
}

export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const activeCompanyId = await requireCompanyContext(session);
    const companyId = new mongoose.Types.ObjectId(activeCompanyId);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: ReportFilters = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      department: searchParams.get('department') || undefined,
      courseId: searchParams.get('courseId') || undefined,
    };

    // Build employees list via memberships
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
      .populate('course', 'title lessons')
      .populate('employee', 'firstName lastName email department');

    // Get all courses for completion stats
    const courses = await Course.find({ companyId: companyId });

    // Calculate overall completion rate
    const completedAssignments = assignments.filter(
      (assignment) => assignment.status === 'completed'
    );
    const overallCompletion =
      assignments.length > 0
        ? (completedAssignments.length / assignments.length) * 100
        : 0;

    // Calculate courses in progress
    const coursesInProgress = assignments.filter(
      (assignment) => assignment.status === 'in-progress'
    ).length;

    // Calculate overdue employees
    const currentDate = new Date();
    const overdueAssignments = assignments.filter((assignment) => {
      return (
        assignment.endDate &&
        new Date(assignment.endDate) < currentDate &&
        assignment.status !== 'completed'
      );
    });

    // Get unique overdue employee count
    const overdueEmployeeIds = new Set(
      overdueAssignments.map((assignment) => assignment.employee._id.toString())
    );
    const overdueEmployeesCount = overdueEmployeeIds.size;

    // Calculate course completion stats
    const courseCompletionStats = await Promise.all(
      courses.map(async (course) => {
        let courseAssignments = assignments.filter(
          (assignment) =>
            assignment.course._id.toString() === course._id.toString()
        );

        // If no course filter is applied, get all assignments for this course
        if (!filters.courseId || filters.courseId === 'all') {
          courseAssignments = await CourseAssignment.find({
            course: course._id,
            employee: { $in: employeeIds },
            companyId: companyId,
          });
        }

        const completedCount = courseAssignments.filter(
          (assignment) => assignment.status === 'completed'
        ).length;

        const completion =
          courseAssignments.length > 0
            ? (completedCount / courseAssignments.length) * 100
            : 0;

        return {
          courseName: course.title,
          completion: Math.round(completion),
        };
      })
    );

    // Calculate detailed employee progress
    const employeeProgressMap = new Map();

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
        });
      }

      const employeeData = employeeProgressMap.get(employeeId);
      employeeData.assignments.push(assignment);

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

    // Generate employee progress list
    const employeeProgressList = Array.from(employeeProgressMap.values()).map(
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
          id: employeeData.id,
          name: employeeData.name,
          email: employeeData.email,
          department: employeeData.department,
          completionPercentage,
          status,
        };
      }
    );

    // Sort by completion percentage (highest first)
    employeeProgressList.sort(
      (a, b) => b.completionPercentage - a.completionPercentage
    );

    const reportData = {
      overallCompletion: Math.round(overallCompletion * 10) / 10, // Round to 1 decimal
      coursesInProgress,
      overdueEmployeesCount,
      courseCompletionStats: courseCompletionStats.filter(
        (stat) => stat.completion > 0 || assignments.length === 0
      ), // Only show courses with data or if no assignments exist
      employeeProgressList,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET available filter options
export async function POST(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as any;
    const companyId = new mongoose.Types.ObjectId(user.companyId);

    const { action } = await request.json();

    if (action === 'getFilterOptions') {
      // Get company with populated employees
      const company = await Company.findById(companyId).populate({
        path: 'employees',
        model: User,
      });

      if (!company) {
        return new NextResponse('Company not found', { status: 404 });
      }

      const employees = company.employees as any[];

      // Get unique departments
      const departments = [
        ...new Set(
          employees
            .map((emp) => emp.department)
            .filter((dept) => dept && dept.trim() !== '')
        ),
      ].sort();

      // Get company courses
      const courses = await Course.find({ companyId: companyId }).select(
        'title _id'
      );

      return NextResponse.json({
        departments,
        courses: courses.map((course) => ({
          id: course._id.toString(),
          title: course.title,
        })),
      });
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
