import { NextResponse } from "next/server"
import dbConnect from "@/lib/dbConnect"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    await dbConnect()

    const { token, password, firstName, lastName, department } = await request.json()

    if (!token || !password || !firstName || !lastName || !department) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const user = await User.findOne({
      invitationToken: token,
      invitationTokenExpires: { $gt: new Date() },
    })

    if (!user) {
      return new NextResponse("Invalid or expired token", { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user.password = hashedPassword
    user.firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
    user.lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1)
    user.department = department
    user.status = "active"
    user.invitationToken = undefined
    user.invitationTokenExpires = undefined
    user.emailVerified = new Date() // Mark email as verified

    await user.save()

    return NextResponse.json({ message: "Account created successfully" })
  } catch (error) {
    console.error("Error creating employee account:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
