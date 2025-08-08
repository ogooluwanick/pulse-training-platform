import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    email: {
      type: String,
      unique: true,
      required: [true, 'Email is required'],
      match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Email is not valid'],
    },
    password: {
      type: String,
      required: function (this: any) {
        return this.status !== 'pending';
      },
      select: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'COMPANY', 'EMPLOYEE'],
      default: 'EMPLOYEE',
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
      ref: 'User',
    },
    department: {
      type: String,
    },
    designation: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'pending',
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
    memberships: [
      {
        companyId: {
          type: Schema.Types.ObjectId,
          ref: 'Company',
          required: true,
        },
        department: {
          type: String,
        },
        designation: {
          type: String,
        },
        status: {
          type: String,
          enum: ['active', 'ended'],
          default: 'active',
        },
        startedAt: {
          type: Date,
          default: Date.now,
        },
        endedAt: {
          type: Date,
        },
      },
    ],
    courseAssignments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CourseAssignment',
      },
    ],
    settings: {
      notifications: {
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        systemUpdates: { type: Boolean, default: true },
        newAdminRegistrations: { type: Boolean, default: true },
        reviewerActivityReports: { type: Boolean, default: true },
        submitterActivityReports: { type: Boolean, default: true },
        newEmployeeOnboarding: { type: Boolean, default: true },
        companyWideAnnouncements: { type: Boolean, default: false },
        courseReminders: { type: Boolean, default: true },
        performanceFeedback: { type: Boolean, default: true },
      },
      session: {
        sessionTimeout: { type: Number, default: 4 }, // in hours
        twoFactorEnabled: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

// Create compound index for memberships to ensure unique user-company combinations
UserSchema.index({ 'memberships.companyId': 1, _id: 1 }, { unique: true });

const User = models.User || model('User', UserSchema);

export default User;
