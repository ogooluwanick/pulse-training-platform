import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Company from '@/lib/models/Company';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';
import User from '@/lib/models/User';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return new NextResponse('Company ID is required', { status: 400 });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const assignments = await CourseAssignment.find({
      employee: { $in: company.employees },
          }).populate({
        path: 'employee',
        model: User,
      });

          const employeesAtRisk = assignments
        .filter((a) => {
          const employee = a.employee as any;
          return (
            employee &&
            (employee.status === 'at-risk' || employee.status === 'overdue')
          );
        })
        .map((a) => a.employee);

    return NextResponse.json(employeesAtRisk);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
