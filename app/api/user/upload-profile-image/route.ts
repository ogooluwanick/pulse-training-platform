import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function buffer(readable: Readable) {
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

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "profile-images",
        public_id: session.user.id,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("Error uploading to Cloudinary:", error);
          return NextResponse.json({ message: "Error uploading file" }, { status: 500 });
        }
        if (result) {
          return NextResponse.json({ imageUrl: result.secure_url });
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(fileBuffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);

  } catch (error) {
    console.error("Error uploading profile image:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
