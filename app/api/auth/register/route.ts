// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../lib/mongodb';
import { sendVerificationEmail } from '../../../../lib/email';
import { createWelcomeNotification } from '@/lib/notificationActivityService';

interface Company {
  name: string;
  employees: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      organizationName,
      phoneNumber,
      designation,
      department,
    } = await req.json();

    // Basic validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    const client = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection('users');
    const companiesCollection = db.collection<Company>('companies');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let companyId;
    if (role === 'COMPANY') {
      const capitalizedCompanyName = organizationName
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      const newCompany = {
        name: capitalizedCompanyName,
        employees: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const companyResult = await companiesCollection.insertOne(newCompany);
      companyId = companyResult.insertedId;
    }

    const newUser = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      companyName: organizationName,
      phoneNumber,
      designation,
      department,
      companyId,
      status: 'pending',
      verificationToken,
      verificationTokenExpires,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const userResult = await usersCollection.insertOne(newUser);
    const userId = userResult.insertedId;

    // Send verification email
    await sendVerificationEmail(
      email,
      `${firstName} ${lastName}`,
      verificationToken,
      true // isNewUser = true for registration flow
    );

    // Create welcome notification for new user
    try {
      const notification = await createWelcomeNotification({
        id: userId.toString(),
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        companyId: companyId?.toString(),
      });

      console.log(
        `[User Registration] Welcome notification created for new user ${userId}`
      );
    } catch (error) {
      console.error(
        `[User Registration] Error creating welcome notification for user ${userId}:`,
        error
      );
      // Continue with registration even if notification fails
    }

    return NextResponse.json(
      {
        message:
          'User registered successfully. Please check your email to verify your account.',
        userId: userId.toString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { message: 'Internal server error.' },
      { status: 500 }
    );
  }
}
