// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from 'mongodb';
import clientPromise from "../../../../lib/mongodb";
import { sendVerificationEmail } from "../../../../lib/email";

interface Company {
  name: string;
  employees: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, role, organizationName } = await req.json();

    // ... validation logic ...
    
    const client = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");
    const companiesCollection = db.collection<Company>("companies");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let companyId;
    if (role === 'COMPANY' && organizationName) {
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

    const newUser: any = {
      firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
      lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
      email,
      password: hashedPassword,
      role: role || 'submitter',
      emailVerified: null,
      verificationToken,
      verificationTokenExpires,
    };

    if (companyId) {
      newUser.companyId = companyId;
      newUser.companyName = organizationName
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    const result = await usersCollection.insertOne(newUser);

    if (companyId) {
      await companiesCollection.updateOne(
        { _id: companyId },
        { $push: { employees: result.insertedId } }
      );
    }

    await sendVerificationEmail(newUser.email, `${firstName} ${lastName}`, verificationToken);

    return NextResponse.json({ message: "User created. Please verify your email." }, { status: 201 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "An error occurred during registration." }, { status: 500 });
  }
}
