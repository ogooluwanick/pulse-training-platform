import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
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
    return NextResponse.json(
      { message: 'Not authenticated or not an admin' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const companies = await Company.find({}).populate({
      path: 'companyAccount',
      select: 'firstName lastName email',
      model: 'User',
    });
    return NextResponse.json(companies, { status: 200 });
  } catch (error: any) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch companies', error: error.message },
      { status: 500 }
    );
  }
}
