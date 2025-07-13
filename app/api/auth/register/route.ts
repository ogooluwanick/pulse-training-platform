// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from 'mongodb';
import clientPromise from "../../../../lib/mongodb";
import { sendVerificationEmail } from "../../../../lib/email";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, role, organizationName } = await req.json();

    // ... validation logic ...
    
    const client = await clientPromise();
    const db = client.db();
    const usersCollection = db.collection("users");
    const companiesCollection = db.collection("companies");

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ message: "User already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    let companyId;
    if (role === 'COMPANY' && organizationName) {
      const newCompany = {
        name: organizationName,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const companyResult = await companiesCollection.insertOne(newCompany);
      companyId = companyResult.insertedId;
    }

    const newUser: any = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || 'submitter',
      emailVerified: null,
      verificationToken,
      verificationTokenExpires,
    };

    if (companyId) {
      newUser.companyId = companyId;
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
