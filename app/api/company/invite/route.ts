import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/dbConnect';
import Company from '@/lib/models/Company';
import User from '@/lib/models/User';
import { sendInvitationEmail } from '@/lib/email';
import crypto from 'crypto';
import { createWelcomeNotification } from '@/lib/notificationActivityService';
import { addUserToCompany, requireCompanyContext } from '@/lib/user-utils';

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

    const companyId = await requireCompanyContext(session);
    const company = await Company.findById(companyId);
    if (!company) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const invitedUsers: string[] = [];
    const failedInvites: Array<{ email: string; reason: string }> = [];
    const notificationResults: any[] = [];

    for (const email of emails) {
      console.log(`[Invite] Processing email: ${email}`);
      const existingUser = await User.findOne({ email });

      if (existingUser) {
        console.log(
          `[Invite] Existing user found: ${existingUser._id}, status: ${existingUser.status}`
        );
        if (existingUser.status === 'pending') {
          // User exists but hasn't completed signup, so resend invitation
          const invitationToken = crypto.randomBytes(32).toString('hex');
          const invitationTokenExpires = new Date(
            Date.now() + 6 * 60 * 60 * 1000
          ); // 6 hours

          existingUser.invitationToken = invitationToken;
          existingUser.invitationTokenExpires = invitationTokenExpires;
          existingUser.invitationTokenCompanyId = companyId;
          await existingUser.save();

          await sendInvitationEmail(email, company.name, invitationToken);
          invitedUsers.push(email);
        } else {
          // User exists and is active – check if they're already a member
          const isAlreadyMember = existingUser.memberships?.some(
            (m: any) =>
              m.companyId.toString() === companyId && m.status === 'active'
          );

          console.log(`[Invite] User memberships:`, existingUser.memberships);
          console.log(`[Invite] Is already member: ${isAlreadyMember}`);

          if (isAlreadyMember) {
            // User is already a member of this company
            console.log(`[Invite] User already member of company ${companyId}`);
            invitedUsers.push(email);
            continue;
          }

          // User exists but not in this company - send invitation email
          console.log(
            `[Invite] Sending invitation email to existing user: ${email}`
          );
          const invitationToken = crypto.randomBytes(32).toString('hex');
          const invitationTokenExpires = new Date(
            Date.now() + 6 * 60 * 60 * 1000
          ); // 6 hours

          existingUser.invitationToken = invitationToken;
          existingUser.invitationTokenExpires = invitationTokenExpires;
          existingUser.invitationTokenCompanyId = companyId;
          await existingUser.save();

          await sendInvitationEmail(email, company.name, invitationToken);
          invitedUsers.push(email);
        }
        continue;
      }

      // New user, create and invite
      console.log(`[Invite] Creating new user: ${email}`);
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationTokenExpires = new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 hours

      const newUser = new User({
        email,
        role: 'EMPLOYEE',
        status: 'pending',
        invitationToken,
        invitationTokenExpires,
        invitationTokenCompanyId: companyId,
      });

      await newUser.save();
      console.log(`[Invite] New user created: ${newUser._id}`);
      await sendInvitationEmail(email, company.name, invitationToken);

      // Create welcome notification for new user
      try {
        const notification = await createWelcomeNotification({
          id: newUser._id.toString(),
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          companyId: companyId,
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

      invitedUsers.push(email);
    }

    console.log(
      `[Invite] Summary - Invited: ${invitedUsers.length}, Failed: ${failedInvites.length}`
    );

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
