import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';
import {
  requireCompanyContext,
  getCompanyEmployees,
  resolveCompanyIdFromRequest,
} from '@/lib/user-utils';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const companyId = new mongoose.Types.ObjectId(session.user.companyId);

    const company = await Company.findById(companyId);

    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    // Build employees list from memberships
    const filteredEmployees = await getCompanyEmployees(companyId.toString());

    // Also get pending invitations (users with invitationTokenCompanyId for this company)
    const pendingInvitations = await User.find({
      invitationTokenCompanyId: companyId,
      status: 'pending',
      role: 'EMPLOYEE',
    }).select('firstName lastName email invitationTokenExpires');
    try {
      console.log('[CompanyEmployeesAPI] Employees fetched', {
        count: filteredEmployees.length,
      });
    } catch {}

    const employeeData = await Promise.all(
      filteredEmployees.map(async (employee: any) => {
        // Find course assignments for this employee
        // For company users, we need to populate courses without status filtering
        // since company users should be able to see all their courses regardless of status
        const assignments = await CourseAssignment.find({
          employee: employee._id,
          companyId: companyId,
        }).populate({
          path: 'course',
          model: Course,
          match: {}, // No status filter for company users
        });

        const coursesCompleted = assignments.filter(
          (a) => a.status === 'completed'
        ).length;

        // Calculate overall progress based on lesson completion
        let totalProgress = 0;
        let totalLessons = 0;

        assignments.forEach((assignment: any) => {
          const courseData = assignment.course;
          if (courseData && courseData.lessons) {
            const courseLessons = courseData.lessons.length;
            const completedLessons = assignment.lessonProgress
              ? assignment.lessonProgress.filter(
                  (lesson: any) => lesson.status === 'completed'
                ).length
              : 0;

            totalLessons += courseLessons;
            totalProgress += completedLessons;
          }
        });

        const overallProgress =
          totalLessons > 0 ? (totalProgress / totalLessons) * 100 : 0;

        // Determine status based on standardized rules
        let status: 'on-track' | 'at-risk' | 'overdue' = 'on-track';

        // Check for overdue: courses assigned more than 14 days ago that aren't completed
        const now = new Date();
        const overdueAssignments = assignments.filter((assignment: any) => {
          if (assignment.status === 'completed') return false;
          if (!assignment.createdAt) return false;

          const assignedDate = new Date(assignment.createdAt);
          const diffDays =
            (now.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays > 14;
        });

        // Check for at-risk: overall progress less than 50% after 5 days
        const atRiskAssignments = assignments.filter((assignment: any) => {
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
        });

        // Determine status
        if (overdueAssignments.length > 0) {
          status = 'overdue';
        } else if (atRiskAssignments.length > 0) {
          status = 'at-risk';
        } else if (
          assignments.length > 0 &&
          assignments.every((a: any) => a.status === 'completed')
        ) {
          status = 'on-track';
        }

        // Calculate time invested (for completed courses)
        const timeInvested = assignments
          .filter((a: any) => a.status === 'completed')
          .reduce((total: number, assignment: any) => {
            return total + (assignment.course?.duration || 0);
          }, 0);

        return {
          id: employee._id,
          name:
            `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
            'Unknown Employee',
          email: employee.email,
          role: 'EMPLOYEE',
          department: employee.department || 'N/A',
          overallProgress: Math.round(overallProgress),
          coursesAssigned: assignments.length,
          coursesCompleted: coursesCompleted,
          overdueCourses: 0, // Removed old calculation, keeping for backward compatibility
          timeInvested: timeInvested,
          lastActivity: employee.updatedAt
            ? new Date(employee.updatedAt).toISOString()
            : 'N/A',
          status: status,
          profileImageUrl: employee.profileImageUrl,
          isActive: true,
        };
      })
    );

    // Add pending invitations to the response
    const pendingInvitationData = pendingInvitations.map((invitation: any) => ({
      id: invitation._id,
      name:
        `${invitation.firstName || ''} ${invitation.lastName || ''}`.trim() ||
        'Pending Employee',
      email: invitation.email,
      role: 'EMPLOYEE',
      department: 'Pending',
      overallProgress: 0,
      coursesAssigned: 0,
      coursesCompleted: 0,
      overdueCourses: 0,
      timeInvested: 0,
      lastActivity: 'N/A',
      status: 'pending' as any,
      profileImageUrl: invitation.profileImageUrl,
      isActive: false,
      isPendingInvitation: true,
      invitationExpires: invitation.invitationTokenExpires,
    }));

    const allEmployeeData = [...employeeData, ...pendingInvitationData];

    return NextResponse.json(allEmployeeData);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
