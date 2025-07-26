import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/dbConnect';
import Course from '@/lib/models/Course';
import { authOptions } from '../../../auth/[...nextauth]/route';

// GET: Debug culture modules system
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const companyId = session.user.companyId || session.user.id;

    // Count all courses
    const totalCourses = await Course.countDocuments();

    // Count culture courses
    const cultureCoursesCount = await Course.countDocuments({
      category: 'culture',
    });

    // Count company-specific culture courses
    const companyCultureCount = await Course.countDocuments({
      category: 'culture',
      isCompanySpecific: true,
      companyId: companyId,
    });

    // Get a few example courses
    const exampleCourses = await Course.find().limit(3).lean();

    return NextResponse.json({
      success: true,
      debug: {
        session: {
          userId: session.user.id,
          role: session.user.role,
          companyId: session.user.companyId,
          effectiveCompanyId: companyId,
        },
        counts: {
          totalCourses,
          cultureCoursesCount,
          companyCultureCount,
        },
        exampleCourses: exampleCourses.map((course) => ({
          id: course._id,
          title: course.title,
          category: course.category,
          isCompanySpecific: course.isCompanySpecific,
          companyId: course.companyId,
        })),
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// POST: Create a test culture module
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Only companies can create test modules' },
        { status: 403 }
      );
    }

    await dbConnect();

    const companyId = session.user.companyId || session.user.id;

    const testModule = new Course({
      title: 'Debug Test Culture Module - ' + new Date().toISOString(),
      description: 'Test module created for debugging',
      category: 'culture',
      isCompanySpecific: true,
      companyId: companyId,
      createdBy: session.user.id,
      lastModifiedBy: session.user.id,
      status: 'draft',
      tags: ['debug', 'test'],
      lessons: [
        {
          title: 'Test Lesson',
          type: 'text',
          content: 'This is a test lesson for debugging culture modules.',
          duration: 5,
        },
      ],
    });

    const savedModule = await testModule.save();

    return NextResponse.json({
      success: true,
      message: 'Test culture module created',
      moduleId: savedModule._id,
      module: {
        id: savedModule._id,
        title: savedModule.title,
        category: savedModule.category,
        isCompanySpecific: savedModule.isCompanySpecific,
        companyId: savedModule.companyId,
      },
    });
  } catch (error) {
    console.error('Test creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create test module',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
