import { Schema, model, models } from "mongoose"

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, "Email is not valid"],
  },
  password: {
    type: String,
    required: function (this: any) {
      return this.status !== "pending"
    },
    select: false,
  },
  role: {
    type: String,
    enum: ["ADMIN", "COMPANY", "EMPLOYEE"],
    default: "EMPLOYEE",
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  companyName: {
    type: String,
  },
  profileImageUrl: {
    type: String,
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  department: {
    type: String,
    required: function (this: any) {
      return this.role === "EMPLOYEE"
    },
  },
  status: {
    type: String,
    enum: ["pending", "active"],
    default: "pending",
  },
  invitationToken: {
    type: String,
    select: false,
  },
  invitationTokenExpires: {
    type: Date,
    select: false,
  },
  emailVerified: {
    type: Date,
  },
  courseAssignments: [
    {
      type: Schema.Types.ObjectId,
      ref: 'CourseAssignment',
    },
  ],
})

const User = models.User || model("User", UserSchema)

export default User
