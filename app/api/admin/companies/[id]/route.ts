import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { id: companyId } = params;
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      return NextResponse.json(
        { message: 'Invalid company ID' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      name,
      industry,
      size,
      website,
      phone,
      address,
      description,
      plan,
      companyAccount,
    } = body;

    const company = await Company.findById(companyId);
    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Update company fields
    if (name) company.name = name;
    if (industry !== undefined) company.industry = industry;
    if (size !== undefined) company.size = size;
    if (website !== undefined) company.website = website;
    if (phone !== undefined) company.phone = phone;
    if (address !== undefined) company.address = address;
    if (description !== undefined) company.description = description;
    if (plan !== undefined) company.plan = plan;

    await company.save();

    // Update company account if provided
    if (companyAccount && companyAccount.email) {
      const user = await User.findById(companyAccount._id);
      if (user) {
        user.email = companyAccount.email;
        if (companyAccount.firstName) user.firstName = companyAccount.firstName;
        if (companyAccount.lastName) user.lastName = companyAccount.lastName;
        await user.save();
      }
    }

    return NextResponse.json(
      { message: 'Company updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to update company:', error);
    return NextResponse.json(
      { message: 'Failed to update company' },
      { status: 500 }
    );
  }
}
