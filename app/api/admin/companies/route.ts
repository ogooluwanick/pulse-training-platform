import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
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
    return NextResponse.json(
      { message: 'Not authenticated or not an admin' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    // Get all companies with populated company account and employee count
    const companies = await Company.find({})
      .populate('companyAccount', 'firstName lastName email')
      .lean();

    // Get employee counts for each company
    const companiesWithDetails = await Promise.all(
      companies.map(async (company) => {
        const employeeCount = await User.countDocuments({
          'memberships.companyId': company._id,
          'memberships.status': 'active',
          role: 'EMPLOYEE',
        });

        return {
          _id: company._id,
          name: company.name,
          status: company.status || 'active',
          companyAccount: company.companyAccount,
          plan: company.plan || 'Trial',
          employeeCount,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          // Add more fields that might be useful for admin management
          industry: company.industry,
          size: company.size,
          website: company.website,
          phone: company.phone,
          address: company.address,
          description: company.description,
        };
      })
    );

    return NextResponse.json(companiesWithDetails);
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { message: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
