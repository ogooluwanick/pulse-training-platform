// app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../../lib/mongodb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL('/auth/verification-result?success=false&error=notoken', req.url));
  }

  const client = await clientPromise();
  const usersCollection = client.db().collection("users");

  const user = await usersCollection.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });

  if (!user) {
    return NextResponse.redirect(new URL('/auth/verification-result?success=false&error=invalid', req.url));
  }

  await usersCollection.updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: new Date() },
      $unset: { verificationToken: "", verificationTokenExpires: "" },
    }
  );

  return NextResponse.redirect(new URL('/auth/verification-result?success=true', req.url));
}
