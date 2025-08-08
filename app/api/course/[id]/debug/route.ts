import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Types } from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    console.log('Course Debug API GET - No session found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  console.log(
    'Course Debug API GET - User:',
    session.user.id,
    'Role:',
    session.user.role,
    'Course ID:',
    params.id
  );

  await dbConnect();

  try {
    // Validate ObjectId format
    if (!Types.ObjectId.isValid(params.id)) {
      console.error('Invalid ObjectId format:', params.id);
      return NextResponse.json(
        { message: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    // Find course without status filter
    const course = await Course.findOne({ _id: params.id }).lean();
    
    if (!course) {
      console.error('Course not found:', params.id);
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      course: {
        _id: course._id,
        title: course.title,
        status: course.status,
        category: course.category,
        companyId: course.companyId,
        isCompanySpecific: course.isCompanySpecific
      }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
