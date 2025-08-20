import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token and new password are required.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const client: MongoClient = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection('users');

    // Find user by verification token (used for new user setup)
    const user = await usersCollection.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }, // Check if token is not expired
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid or expired setup token.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and mark email as verified
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          emailVerified: new Date(),
          status: 'active',
          updatedAt: new Date(),
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpires: '',
        },
      }
    );

    return NextResponse.json(
      { message: 'Password has been set successfully.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Set password error:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
