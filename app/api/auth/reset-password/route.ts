// app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import clientPromise from '../../../../lib/mongodb';

export async function POST(req: NextRequest) {
  const { token, newPassword } = await req.json();
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const client = await clientPromise();
  const usersCollection = client.db().collection('users');

  const user = await usersCollection.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.json(
      { message: 'Invalid or expired token.' },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        password: hashedPassword,
        emailVerified: new Date(),
        status: 'active',
      },
      $unset: { passwordResetToken: '', passwordResetExpires: '' },
    }
  );

  return NextResponse.json(
    { message: 'Password has been reset.' },
    { status: 200 }
  );
}
