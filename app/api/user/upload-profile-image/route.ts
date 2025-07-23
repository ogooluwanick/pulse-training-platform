import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { uploadToCloudinary } from "@/lib/cloudinary_utils";
import User from "@/lib/models/User";
import dbConnect from "@/lib/dbConnect";

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("profileImage") as File;

    if (!file) {
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    const fileBuffer = await buffer(file.stream() as any);

    const result = await uploadToCloudinary(
      fileBuffer,
      "profile-images",
      session.user.id
    );

    if (!result) {
      return NextResponse.json(
        { message: "Error uploading file" },
        { status: 500 }
      );
    }

    await dbConnect();
    await User.findByIdAndUpdate(session.user.id, {
      profileImageUrl: result.secure_url,
    });

    return NextResponse.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
