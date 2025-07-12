// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "../../../../lib/mongodb";
import { sendPasswordResetEmail } from "../../../../lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const client = await clientPromise();
  const usersCollection = client.db().collection("users");
  const user = await usersCollection.findOne({ email });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    const passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { passwordResetToken, passwordResetExpires } }
    );

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
  }

  return NextResponse.json({ message: "If an account exists, a reset link has been sent." }, { status: 200 });
}
