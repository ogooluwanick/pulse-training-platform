import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CourseAssignment from '@/lib/models/CourseAssignment';
import Course from '@/lib/models/Course';
import User from '@/lib/models/User';
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

  if (!token) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  await dbConnect();

  try {
    const companyId = token.companyId;

    // Debug information
    const debug = {
      userInfo: {
        id: token.sub,
        email: token.email,
        role: token.role,
        companyId: companyId,
      },
      database: {
        totalAssignments: await CourseAssignment.countDocuments(),
        totalCourses: await Course.countDocuments(),
        totalUsers: await User.countDocuments(),
      },
      assignments: {
        withCompanyId: await CourseAssignment.countDocuments({
          companyId: { $exists: true },
        }),
        withoutCompanyId: await CourseAssignment.countDocuments({
          companyId: { $exists: false },
        }),
        forThisCompany: companyId
          ? await CourseAssignment.countDocuments({
              companyId: new mongoose.Types.ObjectId(companyId as string),
            })
          : 0,
      },
    };

    // Get sample assignments
    const sampleAssignments = await CourseAssignment.find({})
      .limit(5)
      .populate('course', 'title')
      .populate('employee', 'firstName lastName email')
      .lean();

    debug.sampleAssignments = sampleAssignments;

    // Get assignments without companyId
    const assignmentsWithoutCompany = await CourseAssignment.find({
      companyId: { $exists: false },
    })
      .limit(10)
      .populate('course', 'title')
      .populate('employee', 'firstName lastName email companyId')
      .lean();

    debug.assignmentsWithoutCompanyId = assignmentsWithoutCompany;

    return NextResponse.json(debug, { status: 200 });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      {
        message: 'Debug endpoint error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// POST endpoint to fix assignments missing companyId
export async function POST(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: 'Authentication secret is not configured' },
      { status: 500 }
    );
  }

  const token = await getToken({ req, secret });

  if (!token || token.role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'Admin access required' },
      { status: 401 }
    );
  }

  await dbConnect();

  try {
    // Find assignments without companyId
    const assignmentsWithoutCompany = await CourseAssignment.find({
      companyId: { $exists: false },
    }).populate('employee', 'companyId');

    let fixed = 0;

    for (const assignment of assignmentsWithoutCompany) {
      if (assignment.employee && (assignment.employee as any).companyId) {
        await CourseAssignment.findByIdAndUpdate(assignment._id, {
          companyId: (assignment.employee as any).companyId,
        });
        fixed++;
      }
    }

    return NextResponse.json(
      {
        message: `Fixed ${fixed} assignments`,
        totalFound: assignmentsWithoutCompany.length,
        fixed: fixed,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Fix endpoint error:', error);
    return NextResponse.json(
      {
        message: 'Fix endpoint error',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
