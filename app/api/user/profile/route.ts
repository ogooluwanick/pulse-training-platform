import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise();
    const db = client.db();
    const body = await req.json();
    
    const { _id, ...updateData } = body;

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updateData }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "No changes made" }, { status: 200 });
    }

    const updatedUser = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });

    return NextResponse.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
