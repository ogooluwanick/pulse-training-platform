import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/lib/models/User';
import CourseAssignment from '@/lib/models/CourseAssignment';
import { getToken } from 'next-auth/jwt';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || !['ADMIN', 'COMPANY'].includes(token.role as string)) {
    return NextResponse.json(
      { message: 'Not authenticated or not an admin/company' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    const companyId =
      token.role === 'COMPANY'
        ? new mongoose.Types.ObjectId(token.id as string)
        : undefined;

    const employees = await User.aggregate([
      {
        $match: {
          role: 'EMPLOYEE',
          ...(companyId ? { companyId } : {}),
        },
      },
      {
        $lookup: {
          from: 'courseassignments',
          localField: '_id',
          foreignField: 'employee',
          as: 'assignments',
        },
      },
      {
        $addFields: {
          overallProgress: {
            $cond: {
              if: { $gt: [{ $size: '$assignments' }, 0] },
              then: {
                $round: [
                  {
                    $divide: [
                      {
                        $sum: '$assignments.progress',
                      },
                      { $size: '$assignments' },
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return NextResponse.json(
      { message: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
