// app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../../lib/mongodb';
import { sendVerificationEmail } from '../../../../lib/email';
import crypto from 'crypto';

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
      ); // 24 hours

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
          false // Use regular email verification flow
        );
        return NextResponse.redirect(
          new URL(
            '/auth/verification-result?success=false&error=resent',
            req.url
          )
        );
      } catch (emailError: any) {
        console.error('Error resending verification email:', emailError);
        return NextResponse.redirect(
          new URL(
            '/auth/verification-result?success=false&error=invalid',
            req.url
          )
        );
      }
    }
    return NextResponse.redirect(
      new URL('/auth/verification-result?success=false&error=invalid', req.url)
    );
  }

  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: new Date() },
      $unset: { verificationToken: '', verificationTokenExpires: '' },
    }
  );

  return NextResponse.redirect(
    new URL('/auth/verification-result?success=true', req.url)
  );
}
