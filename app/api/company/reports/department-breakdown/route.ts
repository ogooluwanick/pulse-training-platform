import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';
import { getCompanyEmployees, requireCompanyContext } from '@/lib/user-utils';

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const activeCompanyId = await requireCompanyContext(session);
    const companyId = new mongoose.Types.ObjectId(activeCompanyId);

    const filteredEmployees = await getCompanyEmployees(activeCompanyId);

    const departments = [
      ...new Set(filteredEmployees.map((e) => e.department).filter(Boolean)),
    ];

    const departmentBreakdown = await Promise.all(
      departments.map(async (department) => {
        const departmentEmployees = filteredEmployees.filter(
          (e) => e.department === department
        );
        const employeeIds = departmentEmployees.map((e) => e._id);

        const assignments = await CourseAssignment.find({
          employee: { $in: employeeIds },
          companyId: companyId,
        });
        const completedAssignments = assignments.filter(
          (a) => a.status === 'completed'
        ).length;
        const rate =
          assignments.length > 0
            ? (completedAssignments / assignments.length) * 100
            : 0;

        return {
          department,
          rate: Math.round(rate),
        };
      })
    );

    return NextResponse.json(departmentBreakdown);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
