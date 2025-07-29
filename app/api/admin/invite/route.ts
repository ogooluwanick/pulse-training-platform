import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import { sendInvitationEmail } from '@/lib/email';
import { getToken } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Not authenticated or not an admin' }, { status: 401 });
  }

  await dbConnect();

  const { emails } = await req.json();

  if (!emails || !Array.isArray(emails)) {
    return NextResponse.json({ message: 'Emails are required' }, { status: 400 });
  }

  const invitedUsers = [];
  const failedInvites = [];

  for (const email of emails) {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        failedInvites.push({ email, reason: 'User already exists' });
        continue;
      }

      const newUser = new User({
        email,
        role: 'ADMIN',
        status: 'PENDING',
      });

      await newUser.save();
      await sendInvitationEmail(email, "Pulse", newUser.id);

      invitedUsers.push(newUser);
    } catch (error) {
      console.error(`Failed to invite ${email}:`, error);
      failedInvites.push({ email, reason: 'Server error' });
    }
  }

  return NextResponse.json({ invitedUsers, failedInvites }, { status: 200 });
}
