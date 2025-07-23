import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ message: 'Authentication secret is not configured' }, { status: 500 });
  }

  const token = await getToken({ req, secret });

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const courses = await Course.find({});
    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json({ message: 'Failed to fetch courses' }, { status: 500 });
  }
}
