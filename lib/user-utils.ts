import clientPromise from '@/lib/mongodb';
import { MongoClient } from 'mongodb';
import type { NextRequest } from 'next/server';
import { cookies, headers } from 'next/headers';
import { Types } from 'mongoose';
import User from './models/User';
import Company from './models/Company';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
  companyName?: string;
  department?: string;
  designation?: string;
  status: string;
  profileImageUrl?: string;
  lastOnline?: Date;
  settings?: {
    notifications?: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      systemUpdates?: boolean;
      newAdminRegistrations?: boolean;
      reviewerActivityReports?: boolean;
      submitterActivityReports?: boolean;
      newEmployeeOnboarding?: boolean;
      companyWideAnnouncements?: boolean;
      courseReminders?: boolean;
      performanceFeedback?: boolean;
    };
    session?: {
      sessionTimeout?: number;
      twoFactorEnabled?: boolean;
    };
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const client: MongoClient = await clientPromise();
    const usersCollection = client.db().collection('users');
    const user = await usersCollection.findOne({
      _id: new Types.ObjectId(userId),
    });
    return user as User | null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<User>
): Promise<boolean> {
  try {
    const client: MongoClient = await clientPromise();
    const usersCollection = client.db().collection('users');
    await usersCollection.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: updates }
    );
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

export interface Membership {
  companyId: Types.ObjectId;
  department?: string;
  designation?: string;
  status: 'active' | 'ended';
  startedAt: Date;
  endedAt?: Date;
}

/**
 * Add a user to a company with specified role and details
 */
export const addUserToCompany = async (
  userId: string,
  companyId: string,
  department?: string,
  designation?: string
): Promise<boolean> => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;

    // Check if membership already exists
    const existingMembership = user.memberships?.find(
      (m: any) => m.companyId.toString() === companyId && m.status === 'active'
    );
    if (existingMembership) return true; // Already a member

    // Add new membership
    const newMembership = {
      companyId,
      department,
      designation,
      status: 'active',
      startedAt: new Date(),
    };

    if (!user.memberships) {
      user.memberships = [];
    }
    user.memberships.push(newMembership);
    await user.save();
    return true;
  } catch (error) {
    console.error('Error adding user to company:', error);
    return false;
  }
};

/**
 * Remove a user from a company (end membership)
 */
export async function removeUserFromCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(companyId)) {
      return false;
    }

    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'memberships.$[elem].status': 'ended',
          'memberships.$[elem].endedAt': new Date(),
        },
      },
      {
        arrayFilters: [
          {
            'elem.companyId': new Types.ObjectId(companyId),
            'elem.status': 'active',
          },
        ],
      }
    );

    return true;
  } catch (error) {
    console.error('[UserUtils] Error removing user from company:', error);
    return false;
  }
}

/**
 * Get all active memberships for a user
 */
export const getUserMemberships = async (
  userId: string
): Promise<Membership[]> => {
  try {
    const user = await User.findById(userId).select('memberships');
    return user?.memberships?.filter((m: any) => m.status === 'active') || [];
  } catch (error) {
    console.error('Error getting user memberships:', error);
    return [];
  }
};

/**
 * Check if user has active membership in a company
 */
export const hasCompanyAccess = async (
  userId: string,
  companyId: string
): Promise<boolean> => {
  try {
    const user = await User.findById(userId).select(
      'role companyId memberships'
    );
    if (!user) return false;

    // ADMIN role has access to all companies
    if (user.role === 'ADMIN') return true;

    // Check if user has active membership for this company
    if (user.memberships && Array.isArray(user.memberships)) {
      const hasMembership = user.memberships.some(
        (m: any) =>
          m.companyId.toString() === companyId && m.status === 'active'
      );
      if (hasMembership) return true;
    }

    // For COMPANY role users, check legacy companyId
    if (user.role === 'COMPANY') {
      try {
        // Check if user is the companyAccount for this company
        const company = await Company.findById(companyId);
        if (company && company.companyAccount?.toString() === userId) {
          return true;
        }
      } catch {}
      // Fall back to direct id match (legacy)
      if (
        (user as any).companyId &&
        (user as any).companyId.toString() === companyId
      ) {
        return true;
      }
      // As a safety, allow if there exists a Company whose companyAccount is this user
      const ownsCompany = await Company.exists({
        _id: companyId,
        companyAccount: user._id,
      });
      if (ownsCompany) return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking company access:', error);
    return false;
  }
};

/**
 * Get user's role in a specific company
 */
// getUserCompanyRole removed: Only EMPLOYEE can belong to multiple companies

/**
 * Get all employees for a company
 */
export const getCompanyEmployees = async (companyId: string) => {
  try {
    const users = await User.find({
      'memberships.companyId': companyId,
      'memberships.status': 'active',
    }).select('firstName lastName email memberships');

    return users.map((user) => {
      const membership = user.memberships?.find(
        (m: any) =>
          m.companyId.toString() === companyId && m.status === 'active'
      );
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: membership?.department,
        designation: membership?.designation,
      };
    });
  } catch (error) {
    console.error('Error getting company employees:', error);
    return [];
  }
};

/**
 * Validate company access for API routes
 * Returns the validated companyId or throws an error
 */
export async function requireCompanyContext(
  session: any,
  companyIdFromReq?: string
): Promise<string> {
  let companyId = companyIdFromReq || session?.user?.activeCompanyId;

  // Try header cookie fallbacks if not provided
  if (!companyId) {
    try {
      const hdrs = headers();
      const headerCompanyId = hdrs.get('x-company-id') || undefined;
      if (headerCompanyId) companyId = headerCompanyId;
    } catch {}
  }
  if (!companyId) {
    try {
      const ck = cookies().get('activeCompanyId')?.value;
      if (ck) companyId = ck;
    } catch {}
  }

  if (!companyId) {
    throw new Error('Missing company context');
  }

  const hasAccess = await hasCompanyAccess(session.user.id, companyId);
  if (!hasAccess) {
    throw new Error('You do not have access to this company');
  }

  return companyId;
}

/**
 * Resolve companyId from request (query -> header -> cookie -> session)
 */
export function resolveCompanyIdFromRequest(
  req: NextRequest,
  session: any
): string | undefined {
  try {
    // 1) query param ?companyId=
    const url = new URL(req.url);
    const qp = url.searchParams.get('companyId');
    if (qp) return qp;

    // 2) header x-company-id
    const headerId = req.headers.get('x-company-id');
    if (headerId) return headerId;

    // 3) cookie activeCompanyId
    const cookieId = req.cookies.get('activeCompanyId')?.value;
    if (cookieId) return cookieId;

    // 4) fallback to session
    return session?.user?.activeCompanyId;
  } catch {
    return session?.user?.activeCompanyId;
  }
}
