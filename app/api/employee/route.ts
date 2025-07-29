import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Not authenticated or not an admin' }, { status: 401 });
  }

  await dbConnect();

  try {
    const employees = await User.find({ role: 'EMPLOYEE' });
    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
