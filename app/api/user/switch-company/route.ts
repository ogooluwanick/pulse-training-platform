import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { hasCompanyAccess } from '@/lib/user-utils';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { message: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this company
    const hasAccess = await hasCompanyAccess(session.user.id, companyId);
    if (!hasAccess) {
      return NextResponse.json(
        { message: 'You do not have access to this company' },
        { status: 403 }
      );
    }

    // Persist the active company on the user document
    await dbConnect();
    await User.findByIdAndUpdate(session.user.id, {
      $set: { activeCompanyId: companyId },
    });

    return NextResponse.json({
      message: 'Company switched successfully',
      activeCompanyId: companyId,
    });
  } catch (error) {
    console.error('Error switching company:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Return user's available companies
    return NextResponse.json({
      companyIds: session.user.companyIds || [],
      companyNames: session.user.companyNames || [],
      activeCompanyId: session.user.activeCompanyId,
    });
  } catch (error) {
    console.error('Error getting user companies:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
