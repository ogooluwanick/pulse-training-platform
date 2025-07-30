import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const courses = await Course.find({}).populate('instructor').lean();

    return NextResponse.json({ success: true, modules: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, category, status, difficulty, tags, lessons, finalQuiz, companyId } = body;

    const newCourse = new Course({
      title,
      description,
      category,
      status,
      difficulty,
      tags,
      lessons,
      finalQuiz,
      companyId,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      isCompanySpecific: !!companyId,
    });

    await newCourse.save();

    return NextResponse.json({ success: true, module: newCourse }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
