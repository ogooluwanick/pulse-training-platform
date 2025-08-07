import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';
import { createWelcomeNotification } from '@/lib/notificationActivityService';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'COMPANY') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { emails } = await request.json();
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return new NextResponse('Emails are required', { status: 400 });
    }

    const companyId = session.user.companyId;
    const company = await Company.findById(companyId);
    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const invitedUsers = [];
    const failedInvites = [];
    const notificationResults = [];

    for (const email of emails) {
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        if (existingUser.status === 'pending') {
          // User exists but hasn't completed signup, so resend invitation
          const invitationToken = crypto.randomBytes(32).toString('hex');
          const invitationTokenExpires = new Date(
            Date.now() + 6 * 60 * 60 * 1000
          ); // 6 hours

          existingUser.invitationToken = invitationToken;
          existingUser.invitationTokenExpires = invitationTokenExpires;
          await existingUser.save();

          await sendInvitationEmail(email, company.name, invitationToken);
          invitedUsers.push(email);
        } else {
          // User is already active
          failedInvites.push({
            email,
            reason: 'User is already an active member',
          });
        }
        continue;
      }

      // New user, create and invite
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationTokenExpires = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

      const newUser = new User({
        email,
        companyId,
        role: 'EMPLOYEE',
        status: 'pending',
        invitationToken,
        invitationTokenExpires,
      });

      await newUser.save();
      await sendInvitationEmail(email, company.name, invitationToken);

      // Create welcome notification for new user
      try {
        const notification = await createWelcomeNotification({
          id: newUser._id.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          companyId: newUser.companyId?.toString(),
        });

        notificationResults.push({
          userId: newUser._id.toString(),
          email: newUser.email,
          notification,
        });

        console.log(
          `[Employee Invite] Welcome notification created for new user ${newUser._id}`
        );
      } catch (error) {
        console.error(
          `[Employee Invite] Error creating welcome notification for user ${newUser._id}:`,
          error
        );
        // Continue with invitation even if notification fails
      }

      company.employees.push(newUser._id);
      invitedUsers.push(email);
    }

    await company.save();

    return NextResponse.json({
      message: 'Invitations sent successfully.',
      invitedUsers,
      failedInvites,
      notificationResults,
    });
  } catch (error) {
    console.error('Error inviting employees:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
