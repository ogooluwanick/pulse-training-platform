import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


export async function GET(
  request: Request,
  { params }: { params: { assignmentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const assignment = await CourseAssignment.findById(params.assignmentId)
      .populate({
        path: 'course',
        select: 'title description lessons finalQuiz',
      })
      .populate({
        path: 'employee',
        select: 'name email',
      });

    if (!assignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
    }

    // Optional: Check if the user has permission to view this assignment
    // For example, if the user is a company admin, check if the employee belongs to their company.
    // This logic depends on your data models and authorization rules.

    return NextResponse.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
