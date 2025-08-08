import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Company from '@/lib/models/Company';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('Missing token', { status: 400 });
    }

    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpires: { $gt: new Date() },
    })
      .populate({
        path: 'invitationTokenCompanyId',
        model: Company,
        select: 'name',
      })
      .populate({ path: 'companyId', model: Company, select: 'name' });

    if (!user) {
      return new NextResponse('Invalid or expired token', { status: 400 });
    }

    // Return company being invited, and whether this user email already exists in other companies
    const alreadyEmployeeElsewhere =
      Array.isArray((user as any).memberships) &&
      (user as any).memberships.length > 0;

    // If returning employee, include user data for prefilling
    const responseData: any = {
      message: 'Token is valid',
      companyName:
        (user as any).invitationTokenCompanyId?.name ||
        (user as any).companyId?.name,
      returningEmployee: alreadyEmployeeElsewhere,
    };

    if (alreadyEmployeeElsewhere) {
      responseData.user = {
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error verifying invitation token:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
