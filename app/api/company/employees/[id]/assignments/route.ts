import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import mongoose from 'mongoose';
import Course from '@/lib/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { requireCompanyContext } from '@/lib/user-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const activeCompanyId = await requireCompanyContext(session);
    const { id: employeeId } = params;

    if (!employeeId) {
      return NextResponse.json(
        { message: 'Missing employeeId' },
        { status: 400 }
      );
    }

    // Ensure employeeId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { message: 'Invalid employeeId' },
        { status: 400 }
      );
    }

    const assignments = await CourseAssignment.find({
      employee: new mongoose.Types.ObjectId(employeeId),
      companyId: new mongoose.Types.ObjectId(activeCompanyId),
    }).populate({
      path: 'course',
      model: Course,
      match: {}, // No status filter for company users
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
