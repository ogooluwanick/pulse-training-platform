import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = session.user as any;
    const companyId = new mongoose.Types.ObjectId(user.companyId);

    const company = await Company.findById(companyId).populate({
      path: 'employees',
      model: User,
    });

    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const employees = company.employees as any[];
    const departments = [
      ...new Set(employees.map((e) => e.department).filter(Boolean)),
    ];

    const departmentBreakdown = await Promise.all(
      departments.map(async (department) => {
        const departmentEmployees = employees.filter(
          (e) => e.department === department
        );
        const employeeIds = departmentEmployees.map((e) => e._id);

        const assignments = await CourseAssignment.find({
          employee: { $in: employeeIds },
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
