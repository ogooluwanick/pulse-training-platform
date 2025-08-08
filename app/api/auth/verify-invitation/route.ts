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
    }).select('+invitationTokenCompanyId');

    // Get company information separately to avoid populate issues
    let companyName = 'Unknown Company';
    const invitedCompanyId = (user as any).invitationTokenCompanyId?.toString();

    if (invitedCompanyId) {
      try {
        const company = await Company.findById(invitedCompanyId).select('name');
        if (company) {
          companyName = company.name;
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
      }
    }

    // Return company being invited, and whether this user has existing data to prefill
    const hasExistingData =
      user.firstName || user.lastName || user.department || user.designation;

    // If user has existing data, include it for prefilling
    const responseData: any = {
      message: 'Token is valid',
      companyName: companyName,
      returningEmployee: hasExistingData,
    };

    if (hasExistingData) {
      responseData.user = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        designation: user.designation,
      };
      console.log('Returning employee data for prefilling:', responseData.user);
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error verifying invitation token:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
