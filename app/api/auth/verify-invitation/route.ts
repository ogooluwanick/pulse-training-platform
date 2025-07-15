import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/lib/models/User"
import Company from "@/lib/models/Company"

export async function GET(request: Request) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return new NextResponse("Missing token", { status: 400 })
    }

    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpires: { $gt: new Date() },
    }).populate({
      path: "companyId",
      model: Company,
      select: "name",
    })

    if (!user) {
      return new NextResponse("Invalid or expired token", { status: 400 })
    }

    return NextResponse.json({
      message: "Token is valid",
      companyName: (user.companyId as any)?.name,
    })
  } catch (error) {
    console.error("Error verifying invitation token:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
