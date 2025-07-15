import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import CourseAssignment from '@/lib/models/CourseAssignment';
import dbConnect from '@/lib/dbConnect';
import mongoose from 'mongoose';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    const { courseIds } = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return new NextResponse('Invalid employee ID', { status: 400 });
    }

    const assignments = courseIds.map((courseId: string) => ({
      employeeId: id,
      courseId,
      status: 'not-started',
      companyId: session.user.companyId,
    }));

    await CourseAssignment.insertMany(assignments);

    return NextResponse.json({ message: 'Courses assigned successfully' });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
