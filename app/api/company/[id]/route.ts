import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { name, companyAccount } = body;

    // Update company name
    const updatedCompany = await Company.findByIdAndUpdate(
      params.id,
      { name },
      { new: true }
    );

    if (!updatedCompany) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Update company account email if provided
    if (
      companyAccount &&
      companyAccount.email &&
      updatedCompany.companyAccount
    ) {
      await User.findByIdAndUpdate(
        updatedCompany.companyAccount,
        { email: companyAccount.email },
        { new: true }
      );
    }

    // Fetch updated company with populated company account
    const finalCompany = await Company.findById(params.id).populate(
      'companyAccount'
    );

    return NextResponse.json(finalCompany);
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating company', error },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const company = await Company.findById(params.id);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Toggle company status between active and deactivated
    const newStatus = company.status === 'active' ? 'deactivated' : 'active';
    const updatedCompany = await Company.findByIdAndUpdate(
      params.id,
      { status: newStatus },
      { new: true }
    );

    const action = newStatus === 'active' ? 'activated' : 'deactivated';
    return NextResponse.json({
      message: `Company ${action} successfully`,
      status: newStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error updating company status', error },
      { status: 500 }
    );
  }
}
