// app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { sendVerificationEmail } from '../../../../lib/email';
import crypto from 'crypto';
import { createSuccessNotification } from '@/lib/notificationService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/verification-result?success=false&error=notoken', req.url)
    );
  }

  const client = await clientPromise();
  const usersCollection = client.db().collection('users');

  const user = await usersCollection.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    // Even if the token is invalid or expired, try to find the user by the token
    // to resend the verification email.
    const userToResend = await usersCollection.findOne({
      verificationToken: token,
    });
    if (userToResend) {
      const newVerificationToken = crypto.randomBytes(32).toString('hex');
      const newVerificationTokenExpires = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await usersCollection.updateOne(
        { _id: userToResend._id },
        {
          $set: {
            verificationToken: newVerificationToken,
            verificationTokenExpires: newVerificationTokenExpires,
          },
        }
      );

      try {
        await sendVerificationEmail(
          userToResend.email,
          `${userToResend.firstName} ${userToResend.lastName}`,
          newVerificationToken,
          false
        );
      } catch (error) {
        console.error('Error resending verification email:', error);
      }

      return NextResponse.redirect(
        new URL(
          '/auth/verification-result?success=false&error=expired',
          req.url
        )
      );
    }

    return NextResponse.redirect(
      new URL('/auth/verification-result?success=false&error=invalid', req.url)
    );
  }

  // Mark email as verified
  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerified: new Date(),
        status: 'active',
      },
      $unset: {
        verificationToken: '',
        verificationTokenExpires: '',
      },
    }
  );

  // Create success notification for email verification
  try {
    await createSuccessNotification(
      user._id.toString(),
      'Email Verified! ✅',
      'Your email has been successfully verified. Welcome to Pulse!',
      '/dashboard',
      'email_verification'
    );

    console.log(
      `[Email Verification] Success notification created for user ${user._id}`
    );
  } catch (error) {
    console.error(
      `[Email Verification] Error creating success notification for user ${user._id}:`,
      error
    );
    // Continue with verification even if notification fails
  }

  return NextResponse.redirect(
    new URL('/auth/verification-result?success=true', req.url)
  );
}
