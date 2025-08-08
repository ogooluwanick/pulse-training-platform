import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import Company from '@/lib/models/Company';
import { addUserToCompany } from '@/lib/user-utils';
import bcrypt from 'bcryptjs';
import { createWelcomeNotification } from '@/lib/notificationActivityService';

export async function POST(request: Request) {
  try {
    await dbConnect();

    const { token, password, firstName, lastName, department } =
      await request.json();

    if (!token || !password || !firstName || !lastName || !department) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpires: { $gt: new Date() },
    }).select('+invitationTokenCompanyId');

    if (!user) {
      return new NextResponse('Invalid or expired token', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    user.lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);
    user.department = department;
    user.status = 'active';
    user.invitationToken = undefined;
    user.invitationTokenExpires = undefined;
    user.emailVerified = new Date(); // Mark email as verified
    const invitedCompanyId = (user as any).invitationTokenCompanyId?.toString();
    if (invitedCompanyId) {
      await addUserToCompany(user._id.toString(), invitedCompanyId, department);
      (user as any).invitationTokenCompanyId = undefined;
    }

    await user.save();

    // Create welcome notification for newly activated employee
    try {
      const notification = await createWelcomeNotification({
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: invitedCompanyId || undefined,
      });

      console.log(
        `[Employee Signup] Welcome notification created for newly activated employee ${user._id}`
      );
    } catch (error) {
      console.error(
        `[Employee Signup] Error creating welcome notification for user ${user._id}:`,
        error
      );
      // Continue with signup even if notification fails
    }

    return NextResponse.json({ message: 'Account created successfully' });
  } catch (error) {
    console.error('Error creating employee account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
