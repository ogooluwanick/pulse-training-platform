import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export const dynamic = 'force-dynamic';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Course from '@/lib/models/Course';
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

    const courses = await Course.find({ companyId: companyId });

    const completionRates = await Promise.all(
      courses.map(async (course) => {
        const assignments = await CourseAssignment.find({
          course: course._id,
          employee: { $in: filteredEmployees.map((emp: any) => emp._id) },
          companyId,
        });
        const completedAssignments = assignments.filter(
          (a) => a.status === 'completed'
        ).length;
        const rate =
          assignments.length > 0
            ? (completedAssignments / assignments.length) * 100
            : 0;
        return {
          course: course.title,
          rate: Math.round(rate),
        };
      })
    );

    return NextResponse.json(completionRates);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
