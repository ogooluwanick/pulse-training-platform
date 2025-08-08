import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import { requireCompanyContext, getCompanyEmployees } from '@/lib/user-utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'COMPANY' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    // Handle admin access - they can access any company or all companies
    if (session.user.role === 'ADMIN') {
      const { searchParams } = new URL(req.url);
      const companyId = searchParams.get('companyId');

      if (companyId) {
        // Admin is requesting a specific company
        const company = await Company.findById(companyId).populate({
          path: 'companyAccount',
          model: User,
          select: 'firstName lastName email',
        });
        // .populate({
        //   path: 'savedCourses',
        //   model: 'Course',
        //   select: 'title description',
        // });

        if (!company) {
          return NextResponse.json(
            { message: 'Company not found' },
            { status: 404 }
          );
        }

        return NextResponse.json(company);
      } else {
        // Admin is requesting all companies
        const companies = await Company.find({}).populate({
          path: 'companyAccount',
          model: User,
          select: 'firstName lastName email',
        });
        // .populate({
        //   path: 'savedCourses',
        //   model: 'Course',
        //   select: 'title description',
        // });

        return NextResponse.json(companies);
      }
    } else {
      // Company user - access their own company (from active company context)
      const activeCompanyId = await requireCompanyContext(session);
      const company = await Company.findById(activeCompanyId).populate({
        path: 'companyAccount',
        model: User,
        select: 'firstName lastName email',
      });
      // .populate({
      //   path: 'savedCourses',
      //   model: 'Course',
      //   select: 'title description',
      // });

      if (!company) {
        return NextResponse.json(
          { message: 'Company not found' },
          { status: 404 }
        );
      }

      // Attach employees list via memberships
      const employees = await getCompanyEmployees(activeCompanyId);
      return NextResponse.json({ ...company.toObject(), employees });
    }
  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json(
      { message: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}
