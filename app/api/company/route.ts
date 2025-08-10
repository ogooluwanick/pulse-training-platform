import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import { requireCompanyContext, getCompanyEmployees } from '@/lib/user-utils';
import { Types } from 'mongoose';

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

    // Helper to compute employee count robustly, excluding the company account
    const computeEmployeeCount = async (companyDoc: any) => {
      const companyId = companyDoc._id.toString();
      const companyAccountId =
        companyDoc.companyAccount?._id?.toString?.() ||
        companyDoc.companyAccount?.toString?.();

      // 1) From memberships
      const membershipUsers = await User.find({
        role: 'EMPLOYEE',
        memberships: {
          $elemMatch: {
            companyId: new Types.ObjectId(companyId),
            status: 'active',
          },
        },
      }).select('_id');

      // 2) Legacy: activeCompanyId
      const legacyUsers = await User.find({
        role: 'EMPLOYEE',
        activeCompanyId: new Types.ObjectId(companyId),
      }).select('_id');

      // 3) Historical: company.employees array (if present)
      const historicalEmployeeIds: string[] = Array.isArray(
        (companyDoc as any).employees
      )
        ? ((companyDoc as any).employees || []).map((e: any) => e.toString())
        : [];
      let historicalUsers: { _id: typeof Types.ObjectId.prototype }[] = [];
      if (historicalEmployeeIds.length > 0) {
        historicalUsers = await User.find({
          _id: {
            $in: historicalEmployeeIds.map((id) => new Types.ObjectId(id)),
          },
          role: 'EMPLOYEE',
        }).select('_id');
      }

      const unionSet = new Set<string>();
      for (const u of membershipUsers) unionSet.add(u._id.toString());
      for (const u of legacyUsers) unionSet.add(u._id.toString());
      for (const u of historicalUsers) unionSet.add(u._id.toString());

      if (companyAccountId) {
        unionSet.delete(companyAccountId);
      }

      return unionSet.size;
    };

    // Helper to enrich company with manager info and counts
    const enrichCompany = async (companyDoc: any) => {
      const companyObj = companyDoc.toObject
        ? companyDoc.toObject()
        : companyDoc;

      // Determine manager: prefer populated companyAccount; otherwise find a COMPANY user with this activeCompanyId
      let managerUser = companyObj.companyAccount || null;
      if (!managerUser) {
        managerUser = await User.findOne({
          role: 'COMPANY',
          activeCompanyId: new Types.ObjectId(companyObj._id.toString()),
        }).select('firstName lastName email');
      }
      // Fallback: a COMPANY user who has a membership in this company (legacy/edge cases)
      if (!managerUser) {
        managerUser = await User.findOne({
          role: 'COMPANY',
          memberships: {
            $elemMatch: {
              companyId: new Types.ObjectId(companyObj._id.toString()),
            },
          },
        }).select('firstName lastName email');
      }
      // Fallback: a COMPANY user whose companyName matches the company name
      if (!managerUser && companyObj.name) {
        managerUser = await User.findOne({
          role: 'COMPANY',
          companyName: companyObj.name,
        }).select('firstName lastName email');
      }
      const manager = managerUser
        ? {
            email: managerUser.email,
            fullName: [managerUser.firstName, managerUser.lastName]
              .filter(Boolean)
              .join(' '),
            role: 'COMPANY',
          }
        : null;

      const employeeCount = await computeEmployeeCount(companyObj);

      return {
        ...companyObj,
        manager,
        plan: companyObj.plan ?? 'Trial',
        status: companyObj.status,
        employeeCount,
      };
    };

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
        const enriched = await enrichCompany(company);
        return NextResponse.json(enriched);
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
        const enriched = await Promise.all(
          companies.map((c: any) => enrichCompany(c))
        );
        return NextResponse.json(enriched);
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
      // Attach employees list via memberships and enriched metadata
      const employees = await getCompanyEmployees(activeCompanyId);
      const enriched = await enrichCompany(company);
      return NextResponse.json({ ...enriched, employees });
    }
  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json(
      { message: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}
