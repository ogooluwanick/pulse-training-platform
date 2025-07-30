import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import Course from '@/lib/models/Course';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const companies = await Company.find({}, 'name');
    const courses = await Course.find({}, 'title');

    return NextResponse.json({
      companies: companies.map(c => ({ id: c._id.toString(), name: c.name })),
      courses: courses.map(c => ({ id: c._id.toString(), title: c.title })),
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
